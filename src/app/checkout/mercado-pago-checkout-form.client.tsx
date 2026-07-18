"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	submitMercadoPagoCheckoutPayment,
	type TransparentCheckoutIntent,
	updateCheckoutBuyerData,
	updateCheckoutDeliverySelection,
} from "@/actions/checkout-actions";
import { useTranslations } from "@/i18n/client";
import type { AppLocale } from "@/i18n/config";
import {
	formatCheckoutPhone,
	formatCpf,
	getCheckoutBuyerFieldErrors,
	normalizeBuyerEmail,
	normalizeBuyerName,
} from "@/lib/checkout-buyer";
import { cn, formatMoney } from "@/lib/utils";
import { AddressFields, type AddressValue } from "@/ui/auth/address-fields.client";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { RadioGroup, RadioGroupItem } from "@/ui/shadcn/radio-group";

type MercadoPagoFormData = {
	payment_method_id?: string;
	token?: string;
	installments?: number | string;
	issuer_id?: string | number;
	payer?: {
		email?: string;
		identification?: {
			type?: string;
			number?: string;
		};
	};
};

type MercadoPagoBrickController = {
	unmount?: () => void;
};

type MercadoPagoInstance = {
	bricks: () => {
		create: (
			type: "payment",
			containerId: string,
			settings: Record<string, unknown>,
		) => Promise<MercadoPagoBrickController>;
	};
};

declare global {
	interface Window {
		MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
		__mercadoPagoSdkPromise?: Promise<void>;
	}
}

const MERCADO_PAGO_SDK_TIMEOUT_MS = 15000;
const MERCADO_PAGO_BRICK_TIMEOUT_MS = 15000;

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

function sanitizeMercadoPagoFormData(formData: MercadoPagoFormData) {
	return {
		payment_method_id: formData.payment_method_id,
		token: formData.token,
		installments: formData.installments ? Number(formData.installments) : undefined,
		issuer_id: formData.issuer_id ? String(formData.issuer_id) : undefined,
		payer: {
			email: formData.payer?.email,
			identification: {
				type: formData.payer?.identification?.type,
				number: formData.payer?.identification?.number,
			},
		},
	};
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
	const [buyer, setBuyer] = useState(checkout.buyer);
	const [buyerErrors, setBuyerErrors] = useState<Partial<Record<keyof typeof buyer, string>>>({});
	const [message, setMessage] = useState<string | null>(null);
	const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
	const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingPaymentBrick, setIsLoadingPaymentBrick] = useState(false);
	const [pixPayment, setPixPayment] = useState<{
		paymentId: string;
		qrCode?: string | null;
		qrCodeBase64?: string | null;
		ticketUrl?: string | null;
	} | null>(null);
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

	useEffect(() => {
		if (!deliveryReady || pixPayment) {
			setIsLoadingPaymentBrick(false);
			return;
		}
		let cancelled = false;
		let controller: MercadoPagoBrickController | null = null;
		setIsLoadingPaymentBrick(true);

		void loadMercadoPagoSdk()
			.then(async () => {
				if (cancelled) return;
				if (!window.MercadoPago) throw new Error("Mercado Pago SDK unavailable");
				const mp = new window.MercadoPago(checkout.publishableKey, { locale: "pt-BR" });
				controller = await withTimeout(
					mp.bricks().create("payment", "mercado-pago-payment-brick", {
						initialization: {
							amount: Number((amountTotal / 100).toFixed(2)),
							payer: { email: buyer.email },
						},
						customization: {
							paymentMethods: {
								creditCard: "all",
								debitCard: "all",
								bankTransfer: "all",
								maxInstallments: 12,
							},
						},
						callbacks: {
							onReady: () => {
								if (!cancelled) setIsLoadingPaymentBrick(false);
							},
							onSubmit: async ({ formData }: { formData: MercadoPagoFormData }) => {
								const ready = await prepareCheckoutBeforePayment();
								if (!ready) return Promise.reject();
								const result = await submitMercadoPagoCheckoutPayment({
									orderId: checkout.orderId,
									paymentData: sanitizeMercadoPagoFormData(formData),
								});
								setIsSubmitting(false);
								if ("error" in result) {
									setMessage(result.error ?? null);
									return Promise.reject();
								}
								if (result.qrCode || result.qrCodeBase64 || result.ticketUrl) {
									setPixPayment(result);
									return Promise.resolve();
								}
								if (result.status === "succeeded" || result.status === "processing") {
									router.replace(
										`/checkout/processing?order=${checkout.orderId}&mp_payment=${result.paymentId}&guest=${
											(checkout.isAuthenticated ?? false) ? "0" : "1"
										}`,
									);
									return Promise.resolve();
								}
								setMessage(t("errors.confirmationFailed"));
								return Promise.reject();
							},
							onError: (error: unknown) => {
								console.warn("Mercado Pago Brick error", error);
								setMessage(t("errors.confirmationFailed"));
							},
						},
					}),
					MERCADO_PAGO_BRICK_TIMEOUT_MS,
					"Mercado Pago Brick timed out",
				);
				if (!cancelled) setIsLoadingPaymentBrick(false);
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				console.warn("Mercado Pago checkout load error", error);
				setIsLoadingPaymentBrick(false);
				setMessage("Não foi possível carregar o Mercado Pago. Tente novamente em alguns instantes.");
			});

		return () => {
			cancelled = true;
			controller?.unmount?.();
		};
	}, [
		amountTotal,
		buyer.email,
		checkout.orderId,
		checkout.publishableKey,
		deliveryReady,
		pixPayment,
		router,
		t,
	]);

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
					<BuyerInput id="checkout-cpf-mp" label="CPF" error={buyerErrors.cpf}>
						<Input
							id="checkout-cpf-mp"
							value={buyer.cpf}
							onChange={(event) => setBuyerField("cpf", formatCpf(event.currentTarget.value))}
							onBlur={() => normalizeBuyerField("cpf")}
							inputMode="numeric"
							maxLength={14}
							placeholder="000.000.000-00"
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
						Pix e cartão processados com segurança pelo Mercado Pago.
					</p>
				</div>
				{pixPayment ? (
					<div className="space-y-4 rounded-lg border bg-muted/20 p-4">
						<p className="text-sm font-medium">Pix gerado. Pague pelo QR Code ou copie o código.</p>
						{pixPayment.qrCodeBase64 ? (
							<img
								alt="QR Code Pix"
								className="h-56 w-56 bg-white p-2"
								src={`data:image/png;base64,${pixPayment.qrCodeBase64}`}
							/>
						) : null}
						{pixPayment.qrCode ? (
							<textarea
								readOnly
								className="min-h-24 w-full rounded-md border bg-background p-3 text-xs"
								value={pixPayment.qrCode}
							/>
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
					<div className="space-y-3">
						{isLoadingPaymentBrick ? (
							<p className="text-sm text-muted-foreground" role="status">
								Carregando pagamento do Mercado Pago…
							</p>
						) : null}
						<div id="mercado-pago-payment-brick" aria-busy={isLoadingPaymentBrick} />
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
