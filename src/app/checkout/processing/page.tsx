"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { finalizeAsaasCheckout, saveCheckoutCard } from "@/actions/checkout-actions";
import { useCart } from "@/context/cart-context";
import { useTranslations } from "@/i18n/client";
import { isResolvedCheckoutStatus, isWarningCheckoutStatus } from "@/lib/payment-status";
import { SlPaymentState } from "@/ui/sl/sl-payment-state";

const PROCESSING_POLL_INTERVAL_MS = 1500;
const PROCESSING_TIMEOUT_MS = 15000;
const SUCCESS_REDIRECT_DELAY_MS = 1600;
const ERROR_REDIRECT_DELAY_MS = 2600;

type ProcessingPhase = "processing" | "finalized" | "warning" | "error";
type WarningReason = "timeout" | "disputed";
type CardOffer = { brand: string | null; last4: string | null };
type CardSaveState = "idle" | "saving" | "saved" | "error";

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

export default function ProcessingPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const orderId = searchParams.get("order");
	const isGuest = searchParams.get("guest") === "1";
	const [phase, setPhase] = useState<ProcessingPhase>("processing");
	const [accountEmailSent, setAccountEmailSent] = useState(false);
	const [warningReason, setWarningReason] = useState<WarningReason>("timeout");
	const [cardOffer, setCardOffer] = useState<CardOffer | null>(null);
	const [cardSaveState, setCardSaveState] = useState<CardSaveState>("idle");
	const [setupPasswordRequired, setSetupPasswordRequired] = useState(false);
	const { refreshCart, closeCart } = useCart();
	const t = useTranslations("Checkout.processing");

	useEffect(() => {
		let redirectTimer: ReturnType<typeof setTimeout> | null = null;
		let pollTimer: ReturnType<typeof setTimeout> | null = null;
		let hardTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
		let cancelled = false;
		const startedAt = Date.now();

		function getSuccessPath(setupPasswordRequired = false) {
			const params = new URLSearchParams({ section: "purchases" });
			if (orderId?.startsWith("ord_")) params.set("order", orderId);
			if (setupPasswordRequired) params.set("setupPassword", "1");
			return `/user?${params.toString()}`;
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
				setCardOffer({ brand: result.creditCardBrand, last4: result.creditCardLast4 });
				setSetupPasswordRequired(result.setupPasswordRequired);
			} else if (!isGuest) {
				scheduleRedirect(SUCCESS_REDIRECT_DELAY_MS, getSuccessPath(result.setupPasswordRequired));
			}
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

	function continueAfterCardDecision() {
		setCardOffer(null);
		if (isGuest) return;
		const params = new URLSearchParams({ section: "purchases" });
		if (orderId?.startsWith("ord_")) params.set("order", orderId);
		if (setupPasswordRequired) params.set("setupPassword", "1");
		replaceLocation(router, `/user?${params.toString()}`);
	}

	async function handleSaveCard() {
		if (!orderId) return;
		setCardSaveState("saving");
		const result = await saveCheckoutCard({ orderId });
		setCardSaveState("error" in result ? "error" : "saved");
	}

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
				{done && cardOffer ? (
					<div
						className="mt-4 flex flex-col gap-3 p-4"
						style={{ border: "1px solid var(--sl-ink)", background: "var(--sl-surface-card)" }}
					>
						<div>
							<p className="m-0 text-[14px] font-bold">{t("cardOffer.title")}</p>
							<p className="m-0 mt-1 text-[13px] text-[color:var(--sl-text-muted)]">
								{t("cardOffer.description", {
									brand: cardOffer.brand ?? "Cartão",
									last4: cardOffer.last4 ?? "----",
								})}
							</p>
						</div>
						{cardSaveState === "saved" ? (
							<div className="flex items-center justify-between gap-3">
								<p className="m-0 text-[13px] font-bold text-[color:var(--sl-accent)]">
									{t("cardOffer.saved")}
								</p>
								<button
									type="button"
									className="sl-link text-[13px] font-bold"
									onClick={continueAfterCardDecision}
								>
									{t("cardOffer.continue")}
								</button>
							</div>
						) : (
							<div className="flex flex-wrap items-center gap-3">
								<button
									type="button"
									className="sl-btn sl-btn-buy"
									disabled={cardSaveState === "saving"}
									onClick={handleSaveCard}
								>
									{t("cardOffer.save")}
								</button>
								<button
									type="button"
									className="sl-link text-[13px] font-bold"
									onClick={continueAfterCardDecision}
								>
									{t("cardOffer.skip")}
								</button>
								{cardSaveState === "error" ? (
									<p className="m-0 basis-full text-[12px] text-[color:var(--sl-accent)]">
										{t("cardOffer.error")}
									</p>
								) : null}
							</div>
						)}
					</div>
				) : null}
			</div>
		</main>
	);
}
