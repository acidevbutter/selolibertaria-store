"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
	finalizeCheckoutCleanup,
	recordPaymentIntentCheckout,
	recordSuccessfulCheckout,
} from "@/actions/order-actions";
import { useCart } from "@/context/cart-context";
import { useTranslations } from "@/i18n/client";
import { isResolvedCheckoutStatus, isWarningCheckoutStatus } from "@/lib/payment-status";

const PROCESSING_POLL_INTERVAL_MS = 1500;
const PROCESSING_TIMEOUT_MS = 15000;
const SUCCESS_REDIRECT_DELAY_MS = 1600;
const ERROR_REDIRECT_DELAY_MS = 2600;

type ProcessingPhase = "processing" | "finalized" | "warning" | "error";
type WarningReason = "timeout" | "disputed";

function replaceLocation(router: ReturnType<typeof useRouter>, path: string) {
	router.replace(path);
	if (typeof window === "undefined") return;
	if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return;
	window.location.replace(path);
}

function safelyRefreshCart(refreshCart: ReturnType<typeof useCart>["refreshCart"]) {
	try {
		const result = refreshCart();
		if (result && typeof (result as Promise<unknown>).catch === "function") {
			(result as Promise<unknown>).catch(() => {});
		}
	} catch {
		// noop
	}
}

export default function ProcessingPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const sessionId = searchParams.get("session_id");
	const orderId = searchParams.get("order");
	const paymentIntentId = searchParams.get("payment_intent");
	const isGuest = searchParams.get("guest") === "1";
	const [phase, setPhase] = useState<ProcessingPhase>("processing");
	const [warningReason, setWarningReason] = useState<WarningReason>("timeout");
	const { refreshCart, closeCart } = useCart();
	const ranRef = useRef(false);
	const t = useTranslations("Checkout.processing");

	useEffect(() => {
		let redirectTimer: ReturnType<typeof setTimeout> | null = null;
		let pollTimer: ReturnType<typeof setTimeout> | null = null;
		let hardTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
		let cancelled = false;

		function getSuccessPath() {
			return isGuest ? "/" : "/user?section=purchases";
		}

		function clearTimers() {
			if (redirectTimer) clearTimeout(redirectTimer);
			if (pollTimer) clearTimeout(pollTimer);
			if (hardTimeoutTimer) clearTimeout(hardTimeoutTimer);
		}

		function scheduleRedirect(delayMs: number, path = getSuccessPath()) {
			redirectTimer = setTimeout(() => {
				replaceLocation(router, path);
			}, delayMs);
		}

		async function syncPaymentIntentOnce() {
			const result = await recordPaymentIntentCheckout({
				orderId,
				paymentIntentId,
			});

			if ("error" in result) {
				if (result.status && isWarningCheckoutStatus(result.status)) {
					setWarningReason(result.status === "disputed" ? "disputed" : "timeout");
					setPhase("warning");
					scheduleRedirect(ERROR_REDIRECT_DELAY_MS);
					return "resolved" as const;
				}

				if (result.status && !isResolvedCheckoutStatus(result.status)) {
					setPhase("processing");
					return "retry" as const;
				}

				setPhase("error");
				scheduleRedirect(ERROR_REDIRECT_DELAY_MS);
				return "resolved" as const;
			}

			if (!isResolvedCheckoutStatus(result.status) && !isWarningCheckoutStatus(result.status)) {
				setPhase("processing");
				return "retry" as const;
			}

			if (result.cartCleared) {
				try {
					const cleanup = await finalizeCheckoutCleanup();
					if ("ok" in cleanup) closeCart();
				} catch {
					// noop
				}
			}

			safelyRefreshCart(refreshCart);

			if (result.status && isWarningCheckoutStatus(result.status)) {
				setWarningReason(result.status === "disputed" ? "disputed" : "timeout");
				setPhase("warning");
				scheduleRedirect(ERROR_REDIRECT_DELAY_MS);
				return "resolved" as const;
			}

			setPhase("finalized");
			scheduleRedirect(SUCCESS_REDIRECT_DELAY_MS);
			return "resolved" as const;
		}

		async function pollPaymentIntent() {
			const result = await syncPaymentIntentOnce();
			if (cancelled || result !== "retry") return;
			if (Date.now() - startedAt >= PROCESSING_TIMEOUT_MS) {
				setPhase("warning");
				setWarningReason("timeout");
				replaceLocation(router, getSuccessPath());
				return;
			}

			pollTimer = setTimeout(() => {
				void pollPaymentIntent();
			}, PROCESSING_POLL_INTERVAL_MS);
		}

		if (ranRef.current) return;
		ranRef.current = true;

		const startedAt = Date.now();
		hardTimeoutTimer = setTimeout(() => {
			if (cancelled) return;
			setPhase("warning");
			setWarningReason("timeout");
			replaceLocation(router, getSuccessPath());
		}, PROCESSING_TIMEOUT_MS);

		void (async () => {
			if (orderId?.startsWith("ord_") || paymentIntentId?.startsWith("pi_")) {
				await pollPaymentIntent();
			} else if (sessionId?.startsWith("cs_")) {
				try {
					await recordSuccessfulCheckout(sessionId);
				} catch {
					// noop
				}

				try {
					const cleanup = await finalizeCheckoutCleanup();
					if ("ok" in cleanup) closeCart();
					safelyRefreshCart(refreshCart);
					setPhase("finalized");
					scheduleRedirect(SUCCESS_REDIRECT_DELAY_MS);
				} catch {
					setPhase("error");
					scheduleRedirect(ERROR_REDIRECT_DELAY_MS);
				}
			} else {
				replaceLocation(router, getSuccessPath());
			}
		})();

		return () => {
			cancelled = true;
			clearTimers();
		};
	}, [router, sessionId, orderId, paymentIntentId, isGuest]);

	const done = phase === "finalized";
	const isWarning = phase === "warning";
	const warningKey = warningReason === "disputed" ? "warning.disputed" : "warning.timeout";
	const title = done
		? t("finalized.title")
		: phase === "error"
			? t("error.title")
			: isWarning
				? t(`${warningKey}.title`)
				: t("processing.title");
	const description =
		phase === "processing"
			? t("processing.description")
			: phase === "finalized"
				? t("finalized.description")
				: phase === "warning"
					? t(`${warningKey}.description`)
					: t("error.description");

	return (
		<main className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center px-6 py-12">
			<div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
				<div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border bg-background">
					{phase === "processing" ? (
						<span className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
					) : phase === "finalized" ? (
						<span className="text-2xl">✓</span>
					) : (
						<span className="text-2xl">!</span>
					)}
				</div>
				<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
				<p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
				{isGuest && done ? (
					<p className="mt-4 text-sm leading-6 text-muted-foreground">
						Enviamos o acesso da sua conta por e-mail assim que o pedido for confirmado.
					</p>
				) : null}
			</div>
		</main>
	);
}
