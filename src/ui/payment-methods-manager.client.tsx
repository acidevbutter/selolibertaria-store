"use client";

import { CreditCard, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/client";

interface SavedPaymentMethod {
	id: string;
	type: string;
	billingDetails: {
		name: string | null;
		email: string | null;
	};
	card: {
		brand: string;
		last4: string;
		expMonth: number;
		expYear: number;
	} | null;
	created: number;
}

type LoadState =
	| { type: "loading" }
	| { type: "loaded"; paymentMethods: SavedPaymentMethod[] }
	| { type: "error"; message: string };

function formatBrand(brand: string) {
	return brand
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function formatExpiry(month: number, year: number) {
	return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
}

export function PaymentMethodsManager() {
	const t = useTranslations("PaymentMethods");
	const [state, setState] = useState<LoadState>({ type: "loading" });
	const [removingId, setRemovingId] = useState<string | null>(null);

	async function loadPaymentMethods() {
		setState({ type: "loading" });
		try {
			const res = await fetch("/api/user/payment-methods", { cache: "no-store" });
			const payload = (await res.json().catch(() => ({}))) as { paymentMethods?: SavedPaymentMethod[] };
			if (!res.ok) throw new Error(t("errors.load"));
			setState({ type: "loaded", paymentMethods: payload.paymentMethods || [] });
		} catch (error) {
			setState({
				type: "error",
				message: error instanceof Error ? error.message : t("errors.load"),
			});
		}
	}

	useEffect(() => {
		loadPaymentMethods();
	}, []);

	async function removePaymentMethod(paymentMethodId: string) {
		if (removingId) return;
		const confirmed = window.confirm(t("confirmRemove"));
		if (!confirmed) return;

		setRemovingId(paymentMethodId);
		try {
			const res = await fetch(`/api/user/payment-methods/${paymentMethodId}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error(t("errors.remove"));
			await loadPaymentMethods();
		} catch (error) {
			setState({
				type: "error",
				message: error instanceof Error ? error.message : t("errors.remove"),
			});
		} finally {
			setRemovingId(null);
		}
	}

	if (state.type === "loading") {
		return (
			<div className="rounded-lg border border-dashed p-10 text-center">
				<p className="text-sm text-muted-foreground">{t("loading")}</p>
			</div>
		);
	}

	if (state.type === "error") {
		return (
			<div className="space-y-4 rounded-lg border border-destructive/30 p-6">
				<p className="text-sm text-destructive">{state.message}</p>
				<Button type="button" variant="outline" onClick={loadPaymentMethods}>
					{t("actions.tryAgain")}
				</Button>
			</div>
		);
	}

	if (state.paymentMethods.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-10 text-center">
				<CreditCard className="mx-auto mb-4 size-10 text-muted-foreground/50" />
				<p className="text-sm font-medium">{t("empty.title")}</p>
				<p className="mt-1 text-sm text-muted-foreground">{t("empty.description")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{state.paymentMethods.map((method) => (
				<div
					key={method.id}
					className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
				>
					<div className="flex items-center gap-4">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted">
							<CreditCard className="size-5 text-muted-foreground" />
						</div>
						<div>
							<p className="text-sm font-semibold">
								{method.card
									? t("card.endingIn", {
											brand: formatBrand(method.card.brand),
											last4: method.card.last4,
										})
									: method.type}
							</p>
							{method.card && (
								<p className="text-xs text-muted-foreground">
									{t("card.expires", {
										expiry: formatExpiry(method.card.expMonth, method.card.expYear),
									})}
								</p>
							)}
							{method.billingDetails.name && (
								<p className="text-xs text-muted-foreground">{method.billingDetails.name}</p>
							)}
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						className="gap-2 text-destructive hover:text-destructive"
						disabled={removingId === method.id}
						onClick={() => removePaymentMethod(method.id)}
					>
						<Trash2 className="size-4" />
						{removingId === method.id ? t("actions.removing") : t("actions.remove")}
					</Button>
				</div>
			))}
		</div>
	);
}
