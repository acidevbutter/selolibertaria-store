"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/context/cart-context";
import { useTranslations } from "@/i18n/client";

type CheckoutStatus =
	| "success"
	| "processing"
	| "requires_payment_method"
	| "failed"
	| "cancel"
	| "missing_session"
	| "error"
	| "unknown";

export function CheckoutSuccessHandler() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { refreshCart } = useCart();
	const [ran, setRan] = useState(false);
	const t = useTranslations("Checkout.statusToast");

	useEffect(() => {
		const rawStatus = searchParams.get("checkout");
		if (ran || !rawStatus) return;
		setRan(true);
		const status = normalizeStatus(rawStatus);
		showToast({
			type: statusToastTypes[status],
			title: t(`${status}.title`),
			description: t(`${status}.description`),
		});
		if (status === "success" || status === "processing") refreshCart().catch(() => {});

		const next = new URLSearchParams(Array.from(searchParams.entries()));
		next.delete("checkout");
		next.delete("mp_payment");
		next.delete("order");
		const query = next.toString();
		router.replace(query ? `/?${query}` : "/");
	}, [searchParams, router, ran, refreshCart, t]);

	return null;
}

function normalizeStatus(raw: string): CheckoutStatus {
	const value = raw.toLowerCase();
	if (value === "missing_order") return "missing_session";
	if (value === "invalid_payment") return "error";
	if (
		[
			"success",
			"processing",
			"requires_payment_method",
			"failed",
			"cancel",
			"missing_session",
			"error",
			"unknown",
		].includes(value)
	) {
		return value as CheckoutStatus;
	}
	return "unknown";
}

const statusToastTypes: Record<CheckoutStatus, "success" | "error" | "info" | "warning"> = {
	success: "success",
	processing: "info",
	requires_payment_method: "error",
	failed: "error",
	cancel: "warning",
	missing_session: "error",
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
		default:
			toast(message.title, { description: message.description });
	}
}
