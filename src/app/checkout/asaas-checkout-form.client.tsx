"use client";

import { useState, useTransition } from "react";
import { createAsaasCheckout } from "@/actions/checkout-actions";
import { useCheckoutQuote } from "@/app/checkout/checkout-quote-context";
import type { CheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import { formatCheckoutPhone, formatCpf, getCheckoutBuyerFieldErrors } from "@/lib/checkout-buyer";
import type { CheckoutDeliveryMethod } from "@/lib/shipping-core";
import { AddressFields, type AddressValue } from "@/ui/auth/address-fields.client";
import { SlButton } from "@/ui/sl/sl-button";
import { SlField } from "@/ui/sl/sl-field";

export function AsaasCheckoutForm({ checkout }: { checkout: CheckoutSnapshot }) {
	const [pending, startTransition] = useTransition();
	const [message, setMessage] = useState<string | null>(null);
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
					`Total com frete: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: result.currency }).format(result.amountTotal / 100)}. Confirme para continuar.`,
				);
				return;
			}
			window.location.assign(result.redirectUrl);
		});
	}

	return (
		<form
			className="flex flex-col gap-5"
			onSubmit={submit}
			onChange={() => {
				setQuotedAmount(undefined);
				setQuote(null);
			}}
		>
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
							setAddress(value);
							setQuotedAmount(undefined);
							setQuote(null);
						}}
						required
						countryMode="br-only"
					/>
					<p className="m-0 text-[13px] text-[color:var(--sl-text-muted)]">
						Entregamos somente no Brasil. O frete será calculado antes de emitir a cobrança.
					</p>
				</fieldset>
			) : null}
			{message ? <p className="m-0 text-[13px] text-[color:var(--sl-accent)]">{message}</p> : null}
			<SlButton type="submit" variant="buy" disabled={pending} className="w-full justify-center">
				{pending
					? "Preparando pagamento…"
					: quotedAmount === undefined
						? "Calcular total"
						: "Confirmar e pagar"}
			</SlButton>
		</form>
	);
}
