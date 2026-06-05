"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { finalizeCheckoutCleanup, recordSuccessfulCheckout } from "@/actions/order-actions";
import { useCart } from "@/context/cart-context";
import { useTranslations } from "@/i18n/client";

type CheckoutStatus =
	| "success"
	| "processing"
	| "requires_payment_method"
	| "failed"
	| "open"
	| "expired"
	| "cancel"
	| "forbidden"
	| "invalid_payment_intent"
	| "missing_session"
	| "stripe_not_configured"
	| "error"
	| "unknown";

const successLikeStatuses: CheckoutStatus[] = ["success", "processing"];

export function CheckoutSuccessHandler() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { closeCart, refreshCart } = useCart();
	const [ran, setRan] = useState(false);
	const t = useTranslations("Checkout.statusToast");

	useEffect(() => {
		const statusParam = searchParams.get("checkout");
		const sessionId = searchParams.get("session_id");
		const orderId = searchParams.get("order");
		const paymentIntentId = searchParams.get("payment_intent");
		if (ran || !statusParam || paymentIntentId || orderId) return;
		setRan(true);
		const status = normalizeStatus(statusParam);
		const message = getStatusMessage(t, status);
		(async () => {
			try {
				if (successLikeStatuses.includes(status) && sessionId) {
					try {
						await recordSuccessfulCheckout(sessionId);
						refreshCart().catch(() => {});
					} catch (e) {
						console.warn("Failed to record purchase locally", e);
					}
					const res = await finalizeCheckoutCleanup();

					if ("ok" in res) {
						closeCart();
					}
				}
				showToast(message);

				// If payment succeeded or is processing, refresh the cart so the
				// central `cart` state in `CartProvider` reflects server-side changes.
				if (successLikeStatuses.includes(status)) {
					// best-effort refresh; don't block the UI flow
					refreshCart().catch(() => {});
				}
			} catch (e) {
				console.error("Failed to cleanup after checkout", e);
				showToast(getStatusMessage(t, "error"));
			} finally {
				// Remove the query parameters from the URL
				const sp = new URLSearchParams(Array.from(searchParams.entries()));
				sp.delete("checkout");
				sp.delete("session_id");
				const newQs = sp.toString();
				router.replace(newQs ? `/?${newQs}` : "/");
			}
		})();
	}, [searchParams, router, ran, closeCart, refreshCart, t]);

	return null;
}

function normalizeStatus(raw: string): CheckoutStatus {
	const value = raw.toLowerCase();
	switch (value) {
		case "success":
		case "succeeded":
			return "success";
		case "processing":
		case "requires_payment_method":
		case "failed":
		case "open":
		case "expired":
		case "cancel":
		case "forbidden":
		case "invalid_payment_intent":
		case "missing_session":
		case "stripe_not_configured":
		case "error":
		case "unknown":
			return value;
		default:
			return "unknown";
	}
}

function getStatusMessage(
	t: ReturnType<typeof useTranslations<"Checkout.statusToast">>,
	status: CheckoutStatus | "error",
) {
	return {
		type: statusToastTypes[status],
		title: t(`${status}.title`),
		description: t(`${status}.description`),
	};
}

const statusToastTypes: Record<CheckoutStatus | "error", "success" | "error" | "info" | "warning"> = {
	success: "success",
	processing: "info",
	requires_payment_method: "error",
	failed: "error",
	open: "info",
	expired: "warning",
	cancel: "warning",
	forbidden: "error",
	invalid_payment_intent: "error",
	missing_session: "error",
	stripe_not_configured: "error",
	error: "error",
	unknown: "info",
};

function showToast(message: {
	type: "success" | "error" | "info" | "warning";
	title: string;
	description?: string;
}) {
	switch (message.type) {
		case "success":
			toast.success(message.title, { description: message.description });
			break;
		case "error":
			toast.error(message.title, { description: message.description });
			break;
		case "warning":
			toast.warning(message.title, { description: message.description });
			break;
		case "info":
		default:
			toast(message.title, { description: message.description });
	}
}
