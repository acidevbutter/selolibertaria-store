"use client";

import { useEffect, useState, useTransition } from "react";
import { createAsaasCheckout, getShippingQuote } from "@/actions/checkout-actions";
import { useCheckoutQuote } from "@/app/checkout/checkout-quote-context";
import type { CheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import { formatCheckoutPhone, formatCpf, getCheckoutBuyerFieldErrors } from "@/lib/checkout-buyer";
import type { CheckoutAddress, CheckoutDeliveryMethod } from "@/lib/shipping-core";
import { AddressFields, type AddressValue } from "@/ui/auth/address-fields.client";
import { SlButton } from "@/ui/sl/sl-button";
import { SlField } from "@/ui/sl/sl-field";

type QuoteStatus = "idle" | "loading" | "ready" | "error";

export function AsaasCheckoutForm({ checkout }: { checkout: CheckoutSnapshot }) {
	const [pending, startTransition] = useTransition();
	const [message, setMessage] = useState<string | null>(null);
	const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>("idle");
	const [quotedAmount, setQuotedAmount] = useState<number | undefined>();
	const { setQuote } = useCheckoutQuote();
	const [fullName, setFullName] = useState(checkout.user.name ?? "");
	const [email, setEmail] = useState(checkout.user.email ?? "");
	const [cpf, setCpf] = useState(checkout.user.cpf ?? "");
	const [phone, setPhone] = useState(checkout.user.phone ?? "");
	const [deliveryMethod, setDeliveryMethod] = useState<CheckoutDeliveryMethod>(
		checkout.user.address?.postalCode ? "saved-address" : "new-address",
	);
	const [address, setAddress] = useState<AddressValue>({
		country: "BR",
		line1: "",
		line2: "",
		number: "",
		complement: "",
		district: "",
		city: "",
		state: "",
		postalCode: "",
	});

	async function runQuote(method: CheckoutDeliveryMethod, destination?: CheckoutAddress | null) {
		setQuoteStatus("loading");
		setMessage(null);
		const result = await getShippingQuote({ deliveryMethod: method, address: destination });
		if ("error" in result) {
			setQuoteStatus("error");
			setQuotedAmount(undefined);
			setQuote(null);
			setMessage(result.error ?? "Não foi possível calcular o frete");
			return;
		}
		setQuoteStatus("ready");
		setQuotedAmount(result.amountTotal);
		setQuote({
			amountTotal: result.amountTotal,
			shippingAmount: result.shippingAmount,
			estimatedDays: result.estimatedDays,
			currency: result.currency,
		});
	}

	function invalidateQuote() {
		setQuoteStatus("idle");
		setQuotedAmount(undefined);
		setQuote(null);
		setMessage(null);
	}

	useEffect(() => {
		if (deliveryMethod === "saved-address") {
			if (checkout.user.address) void runQuote("saved-address", checkout.user.address);
			return;
		}
		const digits = (address.postalCode || "").replace(/\D+/g, "");
		if (digits.length === 8) {
			void runQuote("new-address", address);
		} else {
			invalidateQuote();
		}
	}, [deliveryMethod]);

	function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setMessage(null);
		const errors = getCheckoutBuyerFieldErrors({ fullName, email, cpf, phone });
		if (Object.keys(errors).length) {
			setMessage(Object.values(errors)[0] ?? "Confira seus dados");
			return;
		}
		startTransition(async () => {
			const result = await createAsaasCheckout({
				buyer: { fullName, email, cpf, phone },
				deliveryMethod,
				address,
				confirmedAmount: quotedAmount,
			});
			if ("error" in result) {
				setMessage(result.error ?? "Não foi possível iniciar o pagamento");
				return;
			}
			if (result.needsConfirmation === true) {
				setQuotedAmount(result.amountTotal);
				setQuote({
					amountTotal: result.amountTotal,
					shippingAmount: result.shippingAmount,
					estimatedDays: result.estimatedDays,
					currency: result.currency,
				});
				setMessage(
					`O frete foi atualizado para ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: result.currency }).format(result.amountTotal / 100)}. Confirme para continuar.`,
				);
				return;
			}
			window.location.assign(result.redirectUrl);
		});
	}

	const canSubmit = quoteStatus === "ready" && !pending;
	const submitLabel = pending
		? "Preparando pagamento…"
		: quoteStatus === "loading"
			? "Calculando frete…"
			: quoteStatus === "error"
				? "Frete indisponível"
				: quoteStatus === "idle"
					? "Informe um CEP válido para continuar"
					: "Confirmar e pagar";

	return (
		<form className="flex flex-col gap-5" onSubmit={submit}>
			<div>
				<p className="sl-eyebrow m-0 text-[color:var(--sl-accent)]">Pagamento</p>
				<h1 className="sl-head mt-2 text-[32px] leading-[0.98]">Finalizar na Asaas</h1>
				<p className="mt-3 text-[14px] leading-[1.65] text-[color:var(--sl-text-muted)]">
					Escolha o meio de pagamento no ambiente seguro da Asaas, entre as opções disponíveis.
				</p>
			</div>
			<SlField
				label="Nome completo"
				required
				value={fullName}
				onChange={(event) => setFullName(event.target.value)}
			/>
			<SlField
				label="E-mail"
				required
				type="email"
				value={email}
				onChange={(event) => setEmail(event.target.value)}
			/>
			<SlField
				label="CPF"
				required
				inputMode="numeric"
				value={cpf}
				onChange={(event) => setCpf(formatCpf(event.target.value))}
			/>
			<SlField
				label="Telefone"
				required
				inputMode="tel"
				value={phone}
				onChange={(event) => setPhone(formatCheckoutPhone(event.target.value))}
			/>
			<div className="flex flex-col gap-2">
				<label htmlFor="asaas-checkout-delivery" className="sl-lbl">
					Entrega
				</label>
				<select
					id="asaas-checkout-delivery"
					className="sl-field"
					value={deliveryMethod}
					onChange={(event) => setDeliveryMethod(event.target.value as CheckoutDeliveryMethod)}
				>
					{checkout.user.address?.postalCode ? (
						<option value="saved-address">Usar meu endereço salvo</option>
					) : null}
					<option value="new-address">Usar um novo endereço</option>
				</select>
			</div>
			{deliveryMethod === "new-address" ? (
				<fieldset className="m-0 flex flex-col gap-4 border-0 p-0">
					<legend className="sl-lbl p-0">Endereço de entrega</legend>
					<AddressFields
						idPrefix="asaas-checkout"
						value={address}
						onChange={(value) => {
							const postalChanged = value.postalCode !== address.postalCode;
							setAddress(value);
							if (postalChanged) invalidateQuote();
						}}
						onResolvedAddress={(value) => void runQuote("new-address", value)}
						required
						countryMode="br-only"
					/>
					<p className="m-0 text-[13px] text-[color:var(--sl-text-muted)]">
						Entregamos somente no Brasil. Informe o CEP para calcularmos o frete automaticamente.
					</p>
				</fieldset>
			) : null}
			{message ? <p className="m-0 text-[13px] text-[color:var(--sl-accent)]">{message}</p> : null}
			<SlButton type="submit" variant="buy" disabled={!canSubmit} className="w-full justify-center">
				{submitLabel}
			</SlButton>
		</form>
	);
}
