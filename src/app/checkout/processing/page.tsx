"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { finalizeAsaasCheckout, saveCheckoutCard } from "@/actions/checkout-actions";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useTranslations } from "@/i18n/client";
import { isResolvedCheckoutStatus, isWarningCheckoutStatus } from "@/lib/payment-status";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/ui/shadcn/dialog";
import { SlPaymentState } from "@/ui/sl/sl-payment-state";

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
		// Best effort only: the order is already reconciled server-side.
	}
}

function buildSuccessPath(orderId: string | null, setupPasswordRequired = false) {
	const params = new URLSearchParams({ section: "purchases" });
	if (orderId?.startsWith("ord_")) params.set("order", orderId);
	if (setupPasswordRequired) params.set("setupPassword", "1");
	return `/user?${params.toString()}`;
}

export default function ProcessingPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const orderId = searchParams.get("order");
	const isGuest = searchParams.get("guest") === "1";
	const [phase, setPhase] = useState<ProcessingPhase>("processing");
	const [accountEmailSent, setAccountEmailSent] = useState(false);
	const [warningReason, setWarningReason] = useState<WarningReason>("timeout");
	const [cardSavePrompt, setCardSavePrompt] = useState<{ brand: string | null; last4: string | null } | null>(
		null,
	);
	const [savingCard, setSavingCard] = useState(false);
	const [pendingSetupPassword, setPendingSetupPassword] = useState(false);
	const { refreshCart, closeCart } = useCart();
	const t = useTranslations("Checkout.processing");
	const saveCardT = useTranslations("Checkout.saveCard");

	async function handleSaveCard() {
		if (!orderId) {
			setCardSavePrompt(null);
			return;
		}
		setSavingCard(true);
		const result = await saveCheckoutCard({ orderId });
		setSavingCard(false);
		if ("error" in result) {
			toast.error(saveCardT("toast.error"));
		} else {
			toast.success(saveCardT("toast.success"));
		}
		setCardSavePrompt(null);
		if (!isGuest) replaceLocation(router, buildSuccessPath(orderId, pendingSetupPassword));
	}

	function handleSkipSaveCard() {
		setCardSavePrompt(null);
		if (!isGuest) replaceLocation(router, buildSuccessPath(orderId, pendingSetupPassword));
	}

	useEffect(() => {
		let redirectTimer: ReturnType<typeof setTimeout> | null = null;
		let pollTimer: ReturnType<typeof setTimeout> | null = null;
		let hardTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
		let cancelled = false;
		const startedAt = Date.now();

		function getSuccessPath(setupPasswordRequired = false) {
			return buildSuccessPath(orderId, setupPasswordRequired);
		}

		function clearTimers() {
			if (redirectTimer) clearTimeout(redirectTimer);
			if (pollTimer) clearTimeout(pollTimer);
			if (hardTimeoutTimer) clearTimeout(hardTimeoutTimer);
		}

		function scheduleRedirect(delayMs: number, path = getSuccessPath()) {
			redirectTimer = setTimeout(() => replaceLocation(router, path), delayMs);
		}

		async function syncOnce() {
			if (!orderId?.startsWith("ord_")) return "resolved" as const;
			const result = await finalizeAsaasCheckout({ orderId });
			if (cancelled) return "resolved" as const;
			if ("error" in result) {
				if (result.status && isWarningCheckoutStatus(result.status)) {
					setWarningReason(result.status === "disputed" ? "disputed" : "timeout");
					setPhase("warning");
					scheduleRedirect(ERROR_REDIRECT_DELAY_MS);
					return "resolved" as const;
				}
				if (result.status === "processing") return "retry" as const;
				setPhase("error");
				scheduleRedirect(ERROR_REDIRECT_DELAY_MS);
				return "resolved" as const;
			}

			if (!isResolvedCheckoutStatus(result.status) && !isWarningCheckoutStatus(result.status)) {
				setPhase("processing");
				return "retry" as const;
			}

			if (result.cartCleared) {
				closeCart();
			}
			safelyRefreshCart(refreshCart);

			if (isWarningCheckoutStatus(result.status)) {
				setWarningReason(result.status === "disputed" ? "disputed" : "timeout");
				setPhase("warning");
				scheduleRedirect(ERROR_REDIRECT_DELAY_MS);
				return "resolved" as const;
			}

			setPhase("finalized");
			setAccountEmailSent(result.accountEmailSent);
			if (hardTimeoutTimer) clearTimeout(hardTimeoutTimer);
			if (result.cardSaveAvailable) {
				setPendingSetupPassword(result.setupPasswordRequired);
				setCardSavePrompt({ brand: result.creditCardBrand, last4: result.creditCardLast4 });
				return "resolved" as const;
			}
			if (!isGuest) scheduleRedirect(SUCCESS_REDIRECT_DELAY_MS, getSuccessPath(result.setupPasswordRequired));
			return "resolved" as const;
		}

		async function poll() {
			const result = await syncOnce();
			if (cancelled || result !== "retry") return;
			if (Date.now() - startedAt >= PROCESSING_TIMEOUT_MS) {
				setPhase("warning");
				setWarningReason("timeout");
				replaceLocation(router, getSuccessPath());
				return;
			}
			pollTimer = setTimeout(() => void poll(), PROCESSING_POLL_INTERVAL_MS);
		}

		hardTimeoutTimer = setTimeout(() => {
			if (cancelled) return;
			setPhase("warning");
			setWarningReason("timeout");
			replaceLocation(router, getSuccessPath());
		}, PROCESSING_TIMEOUT_MS);

		if (orderId?.startsWith("ord_")) void poll();
		else replaceLocation(router, "/user?section=purchases");

		return () => {
			cancelled = true;
			clearTimers();
		};
	}, [router, orderId, closeCart, refreshCart, isGuest]);

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

	const stateKind = done ? "approved" : phase === "error" ? "declined" : isWarning ? "waiting" : "processing";

	return (
		<main
			className="sl-scope mx-auto flex min-h-[60vh] w-full max-w-lg items-center px-6 py-16"
			style={{ color: "var(--sl-text)" }}
		>
			<div className="w-full">
				<SlPaymentState
					kind={stateKind}
					title={title}
					body={
						<>
							{description}
							{isGuest && done ? (
								<>
									{accountEmailSent
										? " Enviamos um link seguro por e-mail para acessar sua compra."
										: " Seu pagamento foi confirmado, mas não foi possível enviar o acesso por e-mail. Entre em contato com o suporte informando o número do pedido."}
								</>
							) : null}
						</>
					}
				/>
			</div>
			<Dialog
				open={cardSavePrompt !== null}
				onOpenChange={(open) => {
					if (!open) handleSkipSaveCard();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{saveCardT("title")}</DialogTitle>
						<DialogDescription>
							{saveCardT("description", {
								brand: (cardSavePrompt?.brand || saveCardT("unknownBrand")).toUpperCase(),
								last4: cardSavePrompt?.last4 ?? "----",
							})}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={handleSkipSaveCard} disabled={savingCard}>
							{saveCardT("actions.skip")}
						</Button>
						<Button onClick={handleSaveCard} disabled={savingCard}>
							{savingCard ? saveCardT("actions.saving") : saveCardT("actions.save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	);
}
