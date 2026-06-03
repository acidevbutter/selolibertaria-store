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
const PURCHASES_PATH = "/user?section=purchases";

function redirectToPurchases(router: ReturnType<typeof useRouter>) {
	router.replace(PURCHASES_PATH);
	if (typeof window === "undefined") return;
	if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return;
	window.location.replace(PURCHASES_PATH);
}

export default function ProcessingPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const sessionId = searchParams.get("session_id");
	const orderId = searchParams.get("order");
	const paymentIntentId = searchParams.get("payment_intent");
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
		if (ranRef.current) return;
		ranRef.current = true;

		const clearTimers = () => {
			if (redirectTimer) clearTimeout(redirectTimer);
			if (pollTimer) clearTimeout(pollTimer);
			if (hardTimeoutTimer) clearTimeout(hardTimeoutTimer);
		};

		const scheduleRedirect = (delay: number) => {
			if (redirectTimer) clearTimeout(redirectTimer);
			redirectTimer = setTimeout(() => {
				redirectToPurchases(router);
			}, delay);
		};

		hardTimeoutTimer = setTimeout(() => {
			if (cancelled) return;
			redirectToPurchases(router);
		}, PROCESSING_TIMEOUT_MS);

		const setWarningPhase = (reason: WarningReason) => {
			setWarningReason(reason);
			setPhase("warning");
			scheduleRedirect(SUCCESS_REDIRECT_DELAY_MS);
		};

		const syncPaymentIntentOnce = async () => {
			if (!orderId?.startsWith("ord_") && !paymentIntentId?.startsWith("pi_")) {
				redirectToPurchases(router);
				return "resolved" as const;
			}

			try {
				const res = await recordPaymentIntentCheckout({
					orderId,
					paymentIntentId,
				});
				if (cancelled) return "resolved" as const;

				if ("ok" in res) {
					if (res.cartCleared) closeCart();
					refreshCart().catch(() => {});

					if (isWarningCheckoutStatus(res.status)) {
						setWarningPhase("disputed");
						return "resolved" as const;
					}

					if (isResolvedCheckoutStatus(res.status)) {
						setPhase("finalized");
						scheduleRedirect(SUCCESS_REDIRECT_DELAY_MS);
						return "resolved" as const;
					}

					setPhase("processing");
					return "retry" as const;
				}

				if (isWarningCheckoutStatus(res.status)) {
					setWarningPhase("disputed");
					return "resolved" as const;
				}

				if (res.status === "processing") {
					setPhase("processing");
					return "retry" as const;
				}

				setPhase("error");
				scheduleRedirect(ERROR_REDIRECT_DELAY_MS);
				return "resolved" as const;
			} catch {
				if (cancelled) return "resolved" as const;
				setPhase("processing");
				return "retry" as const;
			}
		};

		const startedAt = Date.now();
		const pollPaymentIntent = async () => {
			const result = await syncPaymentIntentOnce();
			if (cancelled || result !== "retry") return;
			if (Date.now() - startedAt >= PROCESSING_TIMEOUT_MS) {
				redirectToPurchases(router);
				return;
			}
			pollTimer = setTimeout(() => {
				void pollPaymentIntent();
			}, PROCESSING_POLL_INTERVAL_MS);
		};

		void (async () => {
			if (orderId?.startsWith("ord_") || paymentIntentId?.startsWith("pi_")) {
				await pollPaymentIntent();
			} else if (sessionId?.startsWith("cs_")) {
				try {
					await recordSuccessfulCheckout(sessionId);
				} catch {}
				try {
					const res = await finalizeCheckoutCleanup();
					if ("ok" in res) {
						closeCart();
						setPhase("finalized");
						refreshCart().catch(() => {});
						scheduleRedirect(SUCCESS_REDIRECT_DELAY_MS);
					} else {
						setPhase("error");
						scheduleRedirect(ERROR_REDIRECT_DELAY_MS);
					}
				} catch {
					setPhase("error");
					scheduleRedirect(ERROR_REDIRECT_DELAY_MS);
				}
			} else {
				redirectToPurchases(router);
			}
		})();

		return () => {
			cancelled = true;
			clearTimers();
		};
	}, [router, sessionId, orderId, paymentIntentId, refreshCart, closeCart]);

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
	const statusLabel =
		phase === "processing"
			? t("processing.waiting")
			: phase === "warning"
				? t(`${warningKey}.waiting`)
				: t("redirecting");

	return (
		<main className="flex flex-col items-center justify-center py-24 px-6 text-center">
			<div className="max-w-md">
				<h1 className="text-2xl font-bold mb-4">{title}</h1>
				<p className="text-sm text-muted-foreground mb-8">{description}</p>
				<div className="flex flex-col items-center">
					<div className="relative w-20 h-20 mb-6">
						{phase === "processing" && (
							<div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary" />
						)}
						<div
							className={`absolute inset-0 flex items-center justify-center transition-opacity ${done ? "opacity-100" : "opacity-0"}`}
						>
							<svg
								className="w-14 h-14 text-primary"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M20 6L9 17l-5-5" />
							</svg>
						</div>
						{(phase === "error" || phase === "warning") && (
							<div className="absolute inset-0 flex items-center justify-center text-destructive">
								<svg
									className="w-12 h-12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M12 9v4" />
									<path d="M12 17h.01" />
									<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
								</svg>
							</div>
						)}
					</div>
					<p className="text-sm font-medium mb-2">{statusLabel}</p>
					<p className="text-xs text-muted-foreground">{t("redirectSoon")}</p>
				</div>
			</div>
		</main>
	);
}
