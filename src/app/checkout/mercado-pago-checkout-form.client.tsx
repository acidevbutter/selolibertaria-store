"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	submitMercadoPagoCheckoutPayment,
	type TransparentCheckoutIntent,
	updateCheckoutBuyerData,
	updateCheckoutDeliverySelection,
} from "@/actions/checkout-actions";
import { useTranslations } from "@/i18n/client";
import type { AppLocale } from "@/i18n/config";
import {
	type MercadoPagoCardPaymentMethod,
	resolveMercadoPagoCardPaymentMethod,
} from "@/lib/checkout/mercado-pago-card";
import {
	formatCheckoutPhone,
	formatCpf,
	getCheckoutBuyerFieldErrors,
	getCheckoutIdentificationType,
	normalizeBuyerEmail,
	normalizeBuyerName,
} from "@/lib/checkout-buyer";
import { cn, formatMoney } from "@/lib/utils";
import { AddressFields, type AddressValue } from "@/ui/auth/address-fields.client";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { RadioGroup, RadioGroupItem } from "@/ui/shadcn/radio-group";

type MercadoPagoInstance = {
	getPaymentMethods: (input: { bin: string }) => Promise<{ results?: MercadoPagoCardPaymentMethod[] }>;
	createCardToken: (input: {
		cardNumber: string;
		cardholderName: string;
		cardExpirationMonth: string;
		cardExpirationYear: string;
		securityCode: string;
		identificationType: "CPF" | "CNPJ";
		identificationNumber: string;
	}) => Promise<{ id?: string }>;
};

declare global {
	interface Window {
		MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
		__mercadoPagoSdkPromise?: Promise<void>;
	}
}

const MERCADO_PAGO_SDK_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
	return new Promise<T>((resolve, reject) => {
		const timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
		promise.then(
			(value) => {
				clearTimeout(timeoutId);
				resolve(value);
			},
			(error) => {
				clearTimeout(timeoutId);
				reject(error);
			},
		);
	});
}

function loadMercadoPagoSdk() {
	if (typeof window === "undefined") return Promise.reject(new Error("Browser unavailable"));
	if (window.MercadoPago) return Promise.resolve();
	if (window.__mercadoPagoSdkPromise) return window.__mercadoPagoSdkPromise;

	const sdkLoad = new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(
			'script[src="https://sdk.mercadopago.com/js/v2"]',
		);
		if (existing) {
			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener("error", () => reject(new Error("Mercado Pago SDK failed to load")), {
				once: true,
			});
			return;
		}

		const script = document.createElement("script");
		script.src = "https://sdk.mercadopago.com/js/v2";
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Mercado Pago SDK failed to load"));
		document.head.appendChild(script);
	});

	window.__mercadoPagoSdkPromise = withTimeout(
		sdkLoad,
		MERCADO_PAGO_SDK_TIMEOUT_MS,
		"Mercado Pago SDK timed out",
	).catch((error) => {
		window.__mercadoPagoSdkPromise = undefined;
		throw error;
	});

	return window.__mercadoPagoSdkPromise;
}

export function MercadoPagoCheckoutForm({
	checkout,
	locale,
}: {
	checkout: TransparentCheckoutIntent;
	locale: AppLocale;
}) {
	const router = useRouter();
	const t = useTranslations("Checkout.form");
	const confirmationFailedMessage = t("errors.confirmationFailed");
	const [buyer, setBuyer] = useState(checkout.buyer);
	const [buyerErrors, setBuyerErrors] = useState<Partial<Record<keyof typeof buyer, string>>>({});
	const [message, setMessage] = useState<string | null>(null);
	const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
	const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
	const [card, setCard] = useState({
		cardholderName: "",
		cardNumber: "",
		expiresAt: "",
		securityCode: "",
		installments: "1",
	});
	const [pixPayment, setPixPayment] = useState<{
		paymentId: string;
		qrCode?: string | null;
		qrCodeBase64?: string | null;
		ticketUrl?: string | null;
		expiresAt?: string | null;
	} | null>(null);
	const [pixCopyMessage, setPixCopyMessage] = useState<string | null>(null);
	const initialDeliveryAddress = toAddressValue(checkout.deliveryAddress ?? null);
	const hasBrazilianCheckoutAddress = initialDeliveryAddress.country === "BR";
	const initialDeliveryMethod: TransparentCheckoutIntent["deliveryMethod"] =
		checkout.deliveryMethod === "pickup"
			? "pickup"
			: hasBrazilianCheckoutAddress
				? checkout.deliveryMethod
				: "new-address";
	const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState(initialDeliveryMethod);
	const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(
		hasBrazilianCheckoutAddress ? initialDeliveryAddress : emptyAddressValue(),
	);
	const [deliveryRate, setDeliveryRate] = useState(
		initialDeliveryMethod === "pickup" || hasBrazilianCheckoutAddress
			? (checkout.shippingRate ?? null)
			: null,
	);
	const [deliveryError, setDeliveryError] = useState(
		initialDeliveryMethod === "pickup" || hasBrazilianCheckoutAddress
			? (checkout.shippingError ?? null)
			: null,
	);
	const [amountTotal, setAmountTotal] = useState(checkout.amountTotal);
	const [newAddress, setNewAddress] = useState<AddressValue>(
		checkout.deliveryMethod === "new-address" && hasBrazilianCheckoutAddress
			? initialDeliveryAddress
			: emptyAddressValue(),
	);
	const hasSavedAddress = checkout.deliveryMethod === "saved-address" && hasBrazilianCheckoutAddress;
	const selectedDeliverySummary = getDeliverySummary(
		selectedDeliveryMethod,
		selectedDeliveryMethod === "new-address" ? newAddress : selectedDeliveryAddress,
		{
			pickup: t("delivery.pickup.shortSummary"),
			pending: t("delivery.pendingSummary"),
		},
	);
	const deliveryReady = Boolean(deliveryRate);

	function setBuyerField<K extends keyof typeof buyer>(field: K, value: (typeof buyer)[K]) {
		setBuyer((current) => ({ ...current, [field]: value }));
		setBuyerErrors((current) => {
			if (!current[field]) return current;
			const next = { ...current };
			delete next[field];
			return next;
		});
	}

	function validateBuyer(nextBuyer = buyer) {
		const errors = getCheckoutBuyerFieldErrors(nextBuyer);
		setBuyerErrors(errors);
		return errors;
	}

	function normalizeBuyerField(field: "fullName" | "email" | "cpf" | "phone") {
		const nextBuyer = {
			...buyer,
			fullName: field === "fullName" ? normalizeBuyerName(buyer.fullName) : buyer.fullName,
			email: field === "email" ? normalizeBuyerEmail(buyer.email) : buyer.email,
			cpf: field === "cpf" ? formatCpf(buyer.cpf) : buyer.cpf,
			phone: field === "phone" ? formatCheckoutPhone(buyer.phone) : buyer.phone,
		};
		setBuyer(nextBuyer);
		validateBuyer(nextBuyer);
	}

	async function applyDeliverySelection(
		nextMethod: TransparentCheckoutIntent["deliveryMethod"],
		address: AddressValue | null = nextMethod === "new-address" ? newAddress : selectedDeliveryAddress,
	) {
		setIsUpdatingDelivery(true);
		setDeliveryError(null);
		setDeliveryMessage(t("delivery.actions.updating"));
		const result = await updateCheckoutDeliverySelection({
			paymentReferenceId: checkout.paymentReferenceId,
			orderId: checkout.orderId,
			deliveryMethod: nextMethod,
			address: nextMethod === "new-address" ? toCheckoutAddress(address) : null,
		});

		if ("error" in result) {
			setDeliveryError(result.error ?? null);
			setIsUpdatingDelivery(false);
			return false;
		}

		setSelectedDeliveryMethod(result.deliveryMethod);
		setSelectedDeliveryAddress(toAddressValue(result.deliveryAddress));
		setDeliveryRate(
			result.shippingRate
				? {
						providerCode: result.shippingRate.providerCode,
						providerLabel: result.shippingRate.providerLabel,
						serviceCode: result.shippingRate.serviceCode,
						serviceName: result.shippingRate.serviceName,
						fixed_amount: {
							amount: result.shippingRate.fixed_amount.amount,
							currency: result.shippingRate.currency ?? checkout.currency,
						},
						estimated_days: result.shippingRate.estimated_days,
						quotedAt: result.shippingRate.quotedAt ?? undefined,
					}
				: null,
		);
		setDeliveryError(result.shippingError ?? null);
		setAmountTotal(result.amountTotal);
		setIsUpdatingDelivery(false);
		return true;
	}

	async function handleDeliveryMethodChange(nextMethod: TransparentCheckoutIntent["deliveryMethod"]) {
		setDeliveryMessage(null);
		setMessage(null);
		setPixPayment(null);
		setPixCopyMessage(null);
		if (nextMethod === "new-address") {
			setSelectedDeliveryMethod(nextMethod);
			setDeliveryError(null);
			setDeliveryRate(null);
			return;
		}
		await applyDeliverySelection(nextMethod);
	}

	async function prepareCheckoutBeforePayment() {
		if (isSubmitting || isUpdatingDelivery) return false;
		setIsSubmitting(true);
		setMessage(null);
		setDeliveryMessage(null);
		setPixPayment(null);
		setPixCopyMessage(null);

		const normalizedBuyer = {
			fullName: normalizeBuyerName(buyer.fullName),
			email: normalizeBuyerEmail(buyer.email),
			cpf: formatCpf(buyer.cpf),
			phone: formatCheckoutPhone(buyer.phone),
		};
		setBuyer(normalizedBuyer);
		const buyerValidationErrors = validateBuyer(normalizedBuyer);
		const firstBuyerError = Object.values(buyerValidationErrors)[0];
		if (firstBuyerError) {
			setMessage(firstBuyerError);
			setIsSubmitting(false);
			return false;
		}

		const buyerResult = await updateCheckoutBuyerData({
			paymentReferenceId: checkout.paymentReferenceId,
			orderId: checkout.orderId,
			buyer: normalizedBuyer,
		});
		if ("error" in buyerResult) {
			setMessage(buyerResult.error ?? null);
			setIsSubmitting(false);
			return false;
		}

		if (!deliveryReady || selectedDeliveryMethod === "new-address") {
			const applied = await applyDeliverySelection(selectedDeliveryMethod, newAddress);
			if (!applied) {
				setIsSubmitting(false);
				return false;
			}
		}

		return true;
	}
	async function submitPayment() {
		const ready = await prepareCheckoutBeforePayment();
		if (!ready) return;

		try {
			let paymentData: {
				payment_method_id: string;
				token?: string;
				installments?: number;
				issuer_id?: string;
			};
			if (paymentMethod === "pix") {
				paymentData = { payment_method_id: "pix" };
			} else {
				const cardNumber = card.cardNumber.replace(/\D/g, "");
				const expiration = card.expiresAt.match(/^(0[1-9]|1[0-2])\/?(\d{2})$/);
				if (
					!card.cardholderName.trim() ||
					cardNumber.length < 13 ||
					!expiration ||
					card.securityCode.length < 3
				) {
					setMessage("Confira os dados do cartão antes de continuar.");
					setIsSubmitting(false);
					return;
				}
				await loadMercadoPagoSdk();
				if (!window.MercadoPago) throw new Error("SDK do Mercado Pago indisponível");
				const mercadoPago = new window.MercadoPago(checkout.publishableKey, {
					locale: "pt-BR",
				});
				const paymentMethods = await mercadoPago.getPaymentMethods({ bin: cardNumber.slice(0, 6) });
				const paymentMethodId = resolveMercadoPagoCardPaymentMethod(paymentMethods.results);
				if (!paymentMethodId) throw new Error("Bandeira do cartão não identificada");
				const token = await mercadoPago.createCardToken({
					cardNumber,
					cardholderName: card.cardholderName.trim(),
					cardExpirationMonth: expiration[1]!,
					cardExpirationYear: `20${expiration[2]!}`,
					securityCode: card.securityCode,
					identificationType: getCheckoutIdentificationType(buyer.cpf),
					identificationNumber: buyer.cpf.replace(/\D/g, ""),
				});
				if (!token.id) throw new Error("Não foi possível tokenizar o cartão");
				paymentData = {
					payment_method_id: paymentMethodId,
					token: token.id,
					installments: Number(card.installments) || 1,
				};
			}

			const result = await submitMercadoPagoCheckoutPayment({ orderId: checkout.orderId, paymentData });
			if ("error" in result) {
				setMessage(result.error ?? null);
				return;
			}
			if (result.qrCode || result.qrCodeBase64 || result.ticketUrl) {
				setPixPayment(result);
				setPixCopyMessage(null);
				return;
			}
			if (result.status === "succeeded" || result.status === "processing") {
				router.replace(
					`/checkout/processing?order=${checkout.orderId}&mp_payment=${result.paymentId}&guest=${checkout.isAuthenticated ? "0" : "1"}`,
				);
				return;
			}
			setMessage(
				result.status === "failed"
					? "Pagamento recusado. Revise os dados ou escolha outra forma de pagamento."
					: confirmationFailedMessage,
			);
		} catch (error) {
			console.warn("Mercado Pago tokenization error", error);
			setMessage("Não foi possível tokenizar o cartão. Confira os dados e tente novamente.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="space-y-6">
			<section className="space-y-4 rounded-xl border bg-background p-4">
				<div className="space-y-1">
					<h2 className="text-base font-semibold">Dados para sua compra</h2>
					<p className="text-sm leading-6 text-muted-foreground">
						Informe seus dados para concluir compra. Sua conta será criada automaticamente e enviaremos o
						acesso por e-mail após confirmação do pagamento.
					</p>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<BuyerInput
						id="checkout-full-name-mp"
						label="Nome completo"
						error={buyerErrors.fullName}
						className="md:col-span-2"
					>
						<Input
							id="checkout-full-name-mp"
							value={buyer.fullName}
							onChange={(event) => setBuyerField("fullName", event.currentTarget.value)}
							onBlur={() => normalizeBuyerField("fullName")}
							autoComplete="name"
							required
						/>
					</BuyerInput>
					<BuyerInput id="checkout-email-mp" label="E-mail" error={buyerErrors.email}>
						<Input
							id="checkout-email-mp"
							type="email"
							value={buyer.email}
							onChange={(event) => setBuyerField("email", event.currentTarget.value)}
							onBlur={() => normalizeBuyerField("email")}
							autoComplete="email"
							required
						/>
					</BuyerInput>
					<BuyerInput id="checkout-cpf-mp" label="CPF ou CNPJ" error={buyerErrors.cpf}>
						<Input
							id="checkout-cpf-mp"
							value={buyer.cpf}
							onChange={(event) => setBuyerField("cpf", formatCpf(event.currentTarget.value))}
							onBlur={() => normalizeBuyerField("cpf")}
							inputMode="numeric"
							maxLength={18}
							placeholder="000.000.000-00 ou 00.000.000/0000-00"
							required
						/>
					</BuyerInput>
					<BuyerInput
						id="checkout-phone-mp"
						label="Telefone"
						error={buyerErrors.phone}
						className="md:col-span-2"
					>
						<Input
							id="checkout-phone-mp"
							type="tel"
							value={buyer.phone}
							onChange={(event) => setBuyerField("phone", formatCheckoutPhone(event.currentTarget.value))}
							onBlur={() => normalizeBuyerField("phone")}
							autoComplete="tel-national"
							inputMode="tel"
							maxLength={15}
							placeholder="(11) 99999-9999"
							required
						/>
					</BuyerInput>
				</div>
			</section>

			<section className="space-y-4 rounded-xl border bg-background p-4">
				<div className="space-y-1">
					<h2 className="text-sm font-semibold">{t("delivery.title")}</h2>
					<p className="text-xs leading-5 text-muted-foreground">{t("delivery.description")}</p>
				</div>
				<RadioGroup
					value={selectedDeliveryMethod}
					onValueChange={(value) =>
						void handleDeliveryMethodChange(value as TransparentCheckoutIntent["deliveryMethod"])
					}
					className="gap-3"
				>
					{hasSavedAddress && checkout.deliveryAddress ? (
						<DeliveryOptionCard
							id="saved-address"
							value="saved-address"
							selected={selectedDeliveryMethod === "saved-address"}
							title={t("delivery.savedAddress.title")}
							description={t("delivery.savedAddress.description")}
							summary={
								selectedDeliveryMethod === "saved-address"
									? selectedDeliverySummary
									: formatAddressBrief(checkout.deliveryAddress)
							}
							radioLabel={t("delivery.savedAddress.label")}
						/>
					) : null}
					<DeliveryOptionCard
						id="new-address"
						value="new-address"
						selected={selectedDeliveryMethod === "new-address"}
						title={t("delivery.newAddress.title")}
						description={t("delivery.newAddress.description")}
						summary={
							selectedDeliveryMethod === "new-address"
								? selectedDeliverySummary
								: t("delivery.newAddress.summary")
						}
						radioLabel={t("delivery.newAddress.label")}
					/>
					<DeliveryOptionCard
						id="pickup"
						value="pickup"
						selected={selectedDeliveryMethod === "pickup"}
						title={t("delivery.pickup.title")}
						description={t("delivery.pickup.description")}
						summary={
							selectedDeliveryMethod === "pickup" ? selectedDeliverySummary : t("delivery.pickup.summary")
						}
						radioLabel={t("delivery.pickup.label")}
					/>
				</RadioGroup>
				{selectedDeliveryMethod === "new-address" ? (
					<div className="space-y-4 rounded-lg border bg-muted/20 p-4">
						<AddressFields
							idPrefix="checkout-delivery-mp"
							value={newAddress}
							onChange={(value) => {
								setNewAddress(value);
								setDeliveryRate(null);
								setDeliveryError(null);
								setDeliveryMessage(null);
								setPixPayment(null);
							}}
							onResolvedAddress={(value) => {
								setNewAddress(value);
								void applyDeliverySelection("new-address", value);
							}}
						/>
						<Button
							type="button"
							variant="outline"
							disabled={isUpdatingDelivery}
							onClick={() => void applyDeliverySelection("new-address", newAddress)}
						>
							{isUpdatingDelivery ? t("delivery.actions.updating") : t("delivery.actions.calculate")}
						</Button>
					</div>
				) : null}
				{deliveryMessage && isUpdatingDelivery ? (
					<p className="text-xs text-muted-foreground">{deliveryMessage}</p>
				) : null}
				{deliveryError ? (
					<p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
						{deliveryError}
					</p>
				) : null}
				<div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-3 text-sm">
					<span>Total</span>
					<span className="text-base font-semibold">
						{formatMoney({ amount: amountTotal, currency: checkout.currency, locale })}
					</span>
				</div>
			</section>

			<section className="space-y-4 rounded-xl border bg-background p-4">
				<div className="space-y-1">
					<h2 className="text-sm font-semibold">Pagamento</h2>
					<p className="text-xs leading-5 text-muted-foreground">
						Escolha Pix ou cartão. Os dados do cartão seguem direto para o Mercado Pago para gerar um token
						seguro.
					</p>
				</div>
				{pixPayment ? (
					<div className="space-y-4 rounded-lg border bg-muted/20 p-4">
						<p className="text-sm font-medium">Pix gerado. Pague pelo QR Code ou copie o código abaixo.</p>
						{pixPayment.qrCodeBase64 ? (
							<img
								alt="QR Code Pix"
								className="h-56 w-56 bg-white p-2"
								src={`data:image/png;base64,${pixPayment.qrCodeBase64}`}
							/>
						) : null}
						{pixPayment.qrCode ? (
							<div className="space-y-2">
								<label className="text-xs font-medium" htmlFor="pix-copy-paste-code">
									Código Pix copia e cola
								</label>
								<textarea
									id="pix-copy-paste-code"
									readOnly
									className="min-h-24 w-full rounded-md border bg-background p-3 text-xs"
									value={pixPayment.qrCode}
								/>
								<Button
									type="button"
									variant="outline"
									onClick={() => void copyPixCode(pixPayment.qrCode!, setPixCopyMessage)}
								>
									Copiar código Pix
								</Button>
								{pixCopyMessage ? (
									<p className="text-xs text-muted-foreground" role="status">
										{pixCopyMessage}
									</p>
								) : null}
							</div>
						) : null}
						{pixPayment.expiresAt ? (
							<p className="text-xs text-muted-foreground">{formatPixExpiration(pixPayment.expiresAt)}</p>
						) : null}
						{pixPayment.ticketUrl ? (
							<a className="text-sm underline" href={pixPayment.ticketUrl} rel="noreferrer" target="_blank">
								Abrir Pix no Mercado Pago
							</a>
						) : null}
						<Button
							type="button"
							onClick={() =>
								router.replace(
									`/checkout/processing?order=${checkout.orderId}&mp_payment=${pixPayment.paymentId}&guest=${(checkout.isAuthenticated ?? false) ? "0" : "1"}`,
								)
							}
						>
							Acompanhar pedido
						</Button>
					</div>
				) : deliveryReady ? (
					<div className="space-y-4">
						<RadioGroup
							value={paymentMethod}
							onValueChange={(value) => setPaymentMethod(value as "pix" | "card")}
						>
							<div className="grid gap-3 sm:grid-cols-2">
								<PaymentMethodOption
									id="payment-pix"
									value="pix"
									selected={paymentMethod === "pix"}
									title="Pix"
									description="Pagamento à vista com QR Code e código copia e cola."
								/>
								<PaymentMethodOption
									id="payment-card"
									value="card"
									selected={paymentMethod === "card"}
									title="Cartão"
									description="Crédito ou débito, com tokenização segura."
								/>
							</div>
						</RadioGroup>
						{paymentMethod === "card" ? (
							<div className="grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-2">
								<BuyerInput id="cardholder-name" label="Nome no cartão" className="md:col-span-2">
									<Input
										id="cardholder-name"
										value={card.cardholderName}
										onChange={(event) =>
											setCard((current) => ({ ...current, cardholderName: event.currentTarget.value }))
										}
										autoComplete="cc-name"
										required
									/>
								</BuyerInput>
								<BuyerInput id="card-number" label="Número do cartão" className="md:col-span-2">
									<Input
										id="card-number"
										value={formatCardNumber(card.cardNumber)}
										onChange={(event) =>
											setCard((current) => ({
												...current,
												cardNumber: event.currentTarget.value.replace(/\D/g, "").slice(0, 19),
											}))
										}
										inputMode="numeric"
										autoComplete="cc-number"
										required
									/>
								</BuyerInput>
								<BuyerInput id="card-expiration" label="Validade">
									<Input
										id="card-expiration"
										value={card.expiresAt}
										onChange={(event) =>
											setCard((current) => ({
												...current,
												expiresAt: formatCardExpiration(event.currentTarget.value),
											}))
										}
										placeholder="MM/AA"
										inputMode="numeric"
										autoComplete="cc-exp"
										required
									/>
								</BuyerInput>
								<BuyerInput id="card-cvv" label="Código de segurança">
									<Input
										id="card-cvv"
										type="password"
										value={card.securityCode}
										onChange={(event) =>
											setCard((current) => ({
												...current,
												securityCode: event.currentTarget.value.replace(/\D/g, "").slice(0, 4),
											}))
										}
										inputMode="numeric"
										autoComplete="cc-csc"
										required
									/>
								</BuyerInput>
								<label className="grid gap-2 text-sm font-medium">
									Parcelas
									<select
										className="h-10 rounded-md border bg-background px-3 text-sm"
										value={card.installments}
										onChange={(event) =>
											setCard((current) => ({ ...current, installments: event.currentTarget.value }))
										}
									>
										{Array.from({ length: 12 }, (_, index) => (
											<option key={index + 1} value={index + 1}>
												{index + 1}x
											</option>
										))}
									</select>
								</label>
								<p className="self-end text-xs leading-5 text-muted-foreground">
									Os dados deste cartão não são enviados ao nosso servidor nem salvos.
								</p>
							</div>
						) : null}
						<Button
							type="button"
							className="w-full"
							disabled={isSubmitting || isUpdatingDelivery}
							onClick={() => void submitPayment()}
						>
							{isSubmitting
								? "Processando pagamento…"
								: paymentMethod === "pix"
									? "Gerar Pix"
									: "Pagar com cartão"}
						</Button>
					</div>
				) : (
					<p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
						Calcule a entrega antes de escolher o pagamento.
					</p>
				)}
			</section>

			{message ? (
				<p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
					{message}
				</p>
			) : null}
			{isSubmitting ? <p className="text-sm text-muted-foreground">{t("actions.processing")}</p> : null}
		</div>
	);
}

function BuyerInput({
	id,
	label,
	error,
	className,
	children,
}: {
	id: string;
	label: string;
	error?: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("grid content-start gap-2", className)}>
			<label className="text-sm font-medium" htmlFor={id}>
				{label}
			</label>
			{children}
			<p className={cn("min-h-4 text-xs", error ? "text-destructive" : "text-transparent")}>{error ?? " "}</p>
		</div>
	);
}

function DeliveryOptionCard({
	id,
	value,
	selected,
	title,
	description,
	summary,
	radioLabel,
}: {
	id: string;
	value: string;
	selected: boolean;
	title: string;
	description: string;
	summary: string;
	radioLabel: string;
}) {
	return (
		<label
			htmlFor={id}
			className={cn(
				"flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors",
				selected && "border-foreground bg-muted/30",
			)}
		>
			<RadioGroupItem id={id} value={value} className="mt-0.5" />
			<span className="block flex-1">
				<span className="block font-medium">{title}</span>
				<span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
				<span className="mt-3 block rounded-md bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
					<span className="block font-medium text-foreground">{radioLabel}</span>
					<span className="block">{summary}</span>
				</span>
			</span>
		</label>
	);
}

function PaymentMethodOption({
	id,
	value,
	selected,
	title,
	description,
}: {
	id: string;
	value: "pix" | "card";
	selected: boolean;
	title: string;
	description: string;
}) {
	return (
		<label
			htmlFor={id}
			className={cn(
				"flex cursor-pointer gap-3 rounded-lg border p-4 text-sm",
				selected && "border-foreground bg-muted/30",
			)}
		>
			<RadioGroupItem id={id} value={value} className="mt-0.5" />
			<span>
				<span className="block font-medium">{title}</span>
				<span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
			</span>
		</label>
	);
}

function emptyAddressValue(): AddressValue {
	return {
		line1: "",
		line2: "",
		number: "",
		complement: "",
		district: "",
		city: "",
		state: "",
		postalCode: "",
		country: "BR",
	};
}

function toAddressValue(
	address: TransparentCheckoutIntent["deliveryAddress"] | null | undefined,
): AddressValue {
	return {
		...emptyAddressValue(),
		line1: address?.line1 ?? "",
		line2: address?.line2 ?? "",
		number: address?.number ?? "",
		complement: address?.complement ?? "",
		district: address?.district ?? "",
		city: address?.city ?? "",
		state: address?.state ?? "",
		postalCode: address?.postalCode ?? "",
		country: address?.country ?? "BR",
	};
}

function toCheckoutAddress(address: AddressValue | null): TransparentCheckoutIntent["deliveryAddress"] {
	if (!address) return null;
	return {
		line1: address.line1.trim(),
		line2: address.line2.trim(),
		number: address.number.trim(),
		complement: address.complement.trim(),
		district: address.district.trim(),
		city: address.city.trim(),
		state: address.state.trim(),
		postalCode: address.postalCode.trim(),
		country: "BR",
	};
}

function formatAddressBrief(address: TransparentCheckoutIntent["deliveryAddress"] | null | undefined) {
	if (!address) return "";
	return [
		address.line1,
		address.number,
		address.district,
		`${address.city ?? ""} - ${address.state ?? ""}`.trim(),
		address.postalCode,
	]
		.filter((part): part is string => Boolean(part?.trim()))
		.join(" · ");
}

function getDeliverySummary(
	method: TransparentCheckoutIntent["deliveryMethod"],
	address: AddressValue | null,
	labels: { pickup: string; pending: string },
) {
	if (method === "pickup") return labels.pickup;
	if (!address) return labels.pending;
	return [
		address.line1,
		address.number,
		address.district,
		`${address.city} - ${address.state}`,
		address.postalCode,
	]
		.filter((part) => part.trim())
		.join(" · ");
}

async function copyPixCode(code: string, setMessage: (message: string) => void) {
	try {
		if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
		await navigator.clipboard.writeText(code);
		setMessage("Código Pix copiado.");
	} catch {
		setMessage("Não foi possível copiar automaticamente. Selecione o código acima para copiar.");
	}
}

function formatPixExpiration(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Confira o prazo de pagamento indicado pelo Mercado Pago.";
	return `Pague até ${new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
	}).format(date)}.`;
}

function formatCardNumber(value: string) {
	return value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatCardExpiration(value: string) {
	const digits = value.replace(/\D/g, "").slice(0, 4);
	return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}
