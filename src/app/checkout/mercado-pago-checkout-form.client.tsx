"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
	continuePendingMercadoPagoPixCheckout,
	getPendingMercadoPagoPixPayment,
	removeSavedMercadoPagoCard,
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
	getCheckoutIdentificationType,
	normalizeBuyerEmail,
	normalizeBuyerName,
} from "@/lib/checkout-buyer";
import { getMaxCardInstallments, getMercadoPagoCardErrorMessage } from "@/lib/mercado-pago-orders/card";
import { cn, formatMoney } from "@/lib/utils";
import { AddressFields, type AddressValue } from "@/ui/auth/address-fields.client";
import { Input } from "@/ui/shadcn/input";
import { RadioGroup, RadioGroupItem } from "@/ui/shadcn/radio-group";
import { SlCardBrandRow } from "@/ui/sl/sl-card-brand-row";
import { SlInstallmentList, type SlInstallmentOption } from "@/ui/sl/sl-installment-list";
import { SlPaymentMethodTabs } from "@/ui/sl/sl-payment-method-tabs";
import { SlPaymentState } from "@/ui/sl/sl-payment-state";
import { SlPixPanel } from "@/ui/sl/sl-pix-panel";
import { SlShippingOption } from "@/ui/sl/sl-shipping-option";

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

type SavedMercadoPagoCard = NonNullable<TransparentCheckoutIntent["savedCards"]>[number];

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
	const confirmationFailedMessage = t("errors.confirmationFailed");
	const [buyer, setBuyer] = useState(checkout.buyer);
	const [buyerErrors, setBuyerErrors] = useState<Partial<Record<keyof typeof buyer, string>>>({});
	const [message, setMessage] = useState<string | null>(null);
	const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
	const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isSubmittingRef = useRef(false);
	const [isLoadingPaymentBrick, setIsLoadingPaymentBrick] = useState(false);
	const buyerRef = useRef(buyer);
	const prepareCheckoutBeforePaymentRef = useRef<() => Promise<boolean>>(() => Promise.resolve(false));
	const [pixPayment, setPixPayment] = useState<{
		paymentId: string;
		qrCode?: string | null;
		qrCodeBase64?: string | null;
		ticketUrl?: string | null;
		expiresAt?: string | null;
	} | null>(null);
	const [pixCopyMessage, setPixCopyMessage] = useState<string | null>(null);
	const [isCheckingPixPayment, setIsCheckingPixPayment] = useState(false);
	const [pixPaymentMessage, setPixPaymentMessage] = useState<string | null>(null);
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"pix" | "card">("pix");
	const [savedCards, setSavedCards] = useState<SavedMercadoPagoCard[]>(checkout.savedCards ?? []);
	const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | null>(null);
	const [savePaymentMethod, setSavePaymentMethod] = useState(false);
	buyerRef.current = buyer;
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
	const deliveryReady = selectedDeliveryMethod === "pickup" || Boolean(deliveryRate);

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

	function stopSubmitting() {
		isSubmittingRef.current = false;
		setIsSubmitting(false);
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
		if (isSubmittingRef.current || isUpdatingDelivery) return false;
		isSubmittingRef.current = true;
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
			stopSubmitting();
			return false;
		}

		const buyerResult = await updateCheckoutBuyerData({
			paymentReferenceId: checkout.paymentReferenceId,
			orderId: checkout.orderId,
			buyer: normalizedBuyer,
		});
		if ("error" in buyerResult) {
			setMessage(buyerResult.error ?? null);
			stopSubmitting();
			return false;
		}

		if (!deliveryReady || selectedDeliveryMethod === "new-address") {
			const applied = await applyDeliverySelection(selectedDeliveryMethod, newAddress);
			if (!applied) {
				stopSubmitting();
				return false;
			}
		}

		return true;
	}
	prepareCheckoutBeforePaymentRef.current = prepareCheckoutBeforePayment;

	async function handlePixPayment() {
		const ready = await prepareCheckoutBeforePayment();
		if (!ready) return;
		const result = await submitMercadoPagoCheckoutPayment({
			orderId: checkout.orderId,
			paymentData: { payment_method_id: "pix" },
		});
		stopSubmitting();
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
				`/checkout/processing?order=${checkout.orderId}&mp_payment=${result.paymentId}&guest=${
					(checkout.isAuthenticated ?? false) ? "0" : "1"
				}`,
			);
			return;
		}
		setMessage("Não foi possível gerar o Pix. Tente novamente em alguns instantes.");
	}

	async function handleSavedCardPayment() {
		if (!selectedSavedCardId) return;
		const ready = await prepareCheckoutBeforePayment();
		if (!ready) return;
		const result = await submitMercadoPagoCheckoutPayment({
			orderId: checkout.orderId,
			paymentData: { payment_method_id: "saved_card", savedCardId: selectedSavedCardId },
		});
		stopSubmitting();
		if ("error" in result) {
			setMessage(result.error ?? null);
			return;
		}
		if (result.status === "succeeded" || result.status === "processing") {
			router.replace(`/checkout/processing?order=${checkout.orderId}&mp_payment=${result.paymentId}&guest=0`);
		}
	}

	async function handleRemoveSavedCard(cardId: string) {
		const result = await removeSavedMercadoPagoCard(cardId);
		if ("error" in result) {
			setMessage(result.error ?? null);
			return;
		}
		setSavedCards((cards) => cards.filter((card) => card.id !== cardId));
		if (selectedSavedCardId === cardId) setSelectedSavedCardId(null);
	}

	async function handlePixPaymentCheck() {
		if (isCheckingPixPayment) return;
		setIsCheckingPixPayment(true);
		setPixPaymentMessage(null);
		const result = await getPendingMercadoPagoPixPayment({ orderId: checkout.orderId });
		setIsCheckingPixPayment(false);
		if ("error" in result) {
			setPixPaymentMessage(result.error ?? "Não foi possível consultar o pagamento Pix.");
			return;
		}
		if (!result.payment) {
			setPixPaymentMessage("Ainda não identificamos este pagamento Pix. Tente novamente em instantes.");
			return;
		}
		if (result.payment.status === "succeeded") {
			router.replace(
				`/checkout/processing?order=${checkout.orderId}&mp_payment=${result.payment.paymentId}&guest=${(checkout.isAuthenticated ?? false) ? "0" : "1"}`,
			);
			return;
		}
		if (result.payment.status === "failed") {
			setPixPayment(null);
			setMessage("Este Pix não está mais disponível. Gere uma nova cobrança para continuar.");
			return;
		}
		const pending = await continuePendingMercadoPagoPixCheckout({ orderId: checkout.orderId });
		if ("error" in pending) {
			setPixPayment(result.payment);
			setPixPaymentMessage(pending.error ?? "Pagamento ainda pendente. Tente novamente em instantes.");
			return;
		}
		router.replace(pending.redirectUrl);
	}

	useEffect(() => {
		let cancelled = false;
		void getPendingMercadoPagoPixPayment({ orderId: checkout.orderId }).then((result) => {
			if (cancelled || "error" in result || !result.payment) return;
			if (result.payment.status === "processing") {
				setPixPayment(result.payment);
			} else if (result.payment.status === "succeeded") {
				router.replace(
					`/checkout/processing?order=${checkout.orderId}&mp_payment=${result.payment.paymentId}&guest=${(checkout.isAuthenticated ?? false) ? "0" : "1"}`,
				);
			} else if (result.payment.status === "failed") {
				setMessage("Este Pix não está mais disponível. Gere uma nova cobrança para continuar.");
			}
		});
		return () => {
			cancelled = true;
		};
	}, [checkout.isAuthenticated, checkout.orderId, router]);

	useEffect(() => {
		if (!deliveryReady || pixPayment || selectedPaymentMethod !== "card" || selectedSavedCardId) {
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
							payer: toMercadoPagoPayer(buyerRef.current),
						},
						customization: {
							paymentMethods: {
								creditCard: "all",
								debitCard: "all",
								maxInstallments: getMaxCardInstallments(amountTotal),
							},
						},
						callbacks: {
							onReady: () => {
								if (!cancelled) setIsLoadingPaymentBrick(false);
							},
							onSubmit: async ({ formData }: { formData: MercadoPagoFormData }) => {
								const ready = await prepareCheckoutBeforePaymentRef.current();
								if (!ready) return Promise.reject();
								const result = await submitMercadoPagoCheckoutPayment({
									orderId: checkout.orderId,
									paymentData: {
										...sanitizeMercadoPagoFormData(formData),
										...(savePaymentMethod ? { savePaymentMethod: true } : {}),
									},
								});
								stopSubmitting();
								if ("error" in result) {
									setMessage(result.error ?? null);
									return Promise.reject();
								}
								if (result.qrCode || result.qrCodeBase64 || result.ticketUrl) {
									setPixPayment(result);
									setPixCopyMessage(null);
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
								if (result.status === "failed") {
									setMessage(getMercadoPagoCardErrorMessage(result.statusDetail));
									return Promise.reject();
								}
								setMessage(confirmationFailedMessage);
								return Promise.reject();
							},
							onError: (error: unknown) => {
								console.warn("Mercado Pago Brick error", error);
								setMessage(confirmationFailedMessage);
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
		selectedPaymentMethod,
		selectedSavedCardId,
		savePaymentMethod,
		router,
		confirmationFailedMessage,
	]);

	const installmentPreview = buildInstallmentPreview(amountTotal, checkout.currency, locale);

	return (
		<div className="sl-scope flex flex-col gap-4">
			<section style={{ border: "1px solid var(--sl-line)", background: "var(--sl-surface-card)" }}>
				<CheckoutStepHeader step="1" label="Identificação" />
				<div className="flex flex-col gap-4 p-6">
					<p className="m-0 text-[14px] leading-[1.6] text-[color:var(--sl-text-muted)]">
						Informe seus dados para concluir a compra. Sua conta é criada automaticamente e o acesso vai por
						e-mail após a confirmação do pagamento.
					</p>
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
				</div>
			</section>

			<section style={{ border: "1px solid var(--sl-line)", background: "var(--sl-surface-card)" }}>
				<CheckoutStepHeader step="2" label="Entrega" />
				<div className="flex flex-col gap-4 p-6">
					<p className="m-0 text-[14px] leading-[1.6] text-[color:var(--sl-text-muted)]">
						{t("delivery.description")}
					</p>
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
						<div
							className="flex flex-col gap-4 p-4"
							style={{ border: "1px solid var(--sl-line-strong)", background: "var(--sl-sand)" }}
						>
							<AddressFields
								idPrefix="checkout-delivery-mp"
								countryMode="br-only"
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
							<button
								type="button"
								className="sl-btn sl-btn-secondary self-start"
								disabled={isUpdatingDelivery}
								onClick={() => void applyDeliverySelection("new-address", newAddress)}
							>
								{isUpdatingDelivery ? t("delivery.actions.updating") : t("delivery.actions.calculate")}
							</button>
						</div>
					) : null}
					{deliveryMessage && isUpdatingDelivery ? (
						<p className="m-0 text-[12px] text-[color:var(--sl-text-soft)]">{deliveryMessage}</p>
					) : null}
					{deliveryError ? (
						<p
							className="m-0 px-3 py-2 text-[12px]"
							style={{
								border: "1px solid var(--sl-wine)",
								background: "var(--sl-danger-wash)",
								color: "var(--sl-accent)",
							}}
						>
							{deliveryError}
						</p>
					) : null}
					{deliveryRate ? (
						<SlShippingOption
							selected
							label={`${deliveryRate.providerLabel}${
								deliveryRate.serviceName ? ` · ${deliveryRate.serviceName}` : ""
							}${
								deliveryRate.estimated_days
									? ` · ${deliveryRate.estimated_days} ${deliveryRate.estimated_days === 1 ? "dia útil" : "dias úteis"}`
									: ""
							}`}
							price={formatMoney({
								amount: deliveryRate.fixed_amount.amount,
								currency: deliveryRate.fixed_amount.currency,
								locale,
							})}
						/>
					) : null}
					<div
						className="flex items-center justify-between px-3.5 py-3 text-[14px]"
						style={{ background: "var(--sl-surface-band)" }}
					>
						<span className="font-bold">Total</span>
						<span className="sl-price text-[22px]">
							{formatMoney({ amount: amountTotal, currency: checkout.currency, locale })}
						</span>
					</div>
				</div>
			</section>

			<section style={{ border: "1px solid var(--sl-ink)", background: "var(--sl-surface-card)" }}>
				<div
					className="flex items-center gap-3.5 px-6 py-4"
					style={{ background: "var(--sl-ink)", color: "var(--sl-text-on-ink)" }}
				>
					<span
						className="inline-flex h-7 w-7 items-center justify-center text-[13px] font-black"
						style={{ background: "var(--sl-buy)" }}
					>
						3
					</span>
					<p className="sl-u m-0 text-[12px] tracking-[0.24em]">Pagamento</p>
				</div>
				<div className="flex flex-col gap-5 p-6">
					{pixPayment ? (
						<SlPixPanel
							qrCodeBase64={pixPayment.qrCodeBase64}
							code={pixPayment.qrCode}
							expiresLabel={pixPayment.expiresAt ? formatPixExpiration(pixPayment.expiresAt) : undefined}
							ticketUrl={pixPayment.ticketUrl}
							onCopy={
								pixPayment.qrCode
									? () => void copyPixCode(pixPayment.qrCode as string, setPixCopyMessage)
									: undefined
							}
							copyMessage={pixCopyMessage}
							footer={
								<div className="flex flex-col gap-2">
									<button
										type="button"
										className="sl-btn sl-btn-primary w-full"
										disabled={isCheckingPixPayment}
										onClick={() => void handlePixPaymentCheck()}
									>
										{isCheckingPixPayment ? "Verificando pagamento…" : "Já paguei"}
									</button>
									{pixPaymentMessage ? (
										<p className="m-0 text-[12px] text-[color:var(--sl-text-soft)]" role="status">
											{pixPaymentMessage}
										</p>
									) : null}
								</div>
							}
						/>
					) : deliveryReady ? (
						<>
							<SlPaymentMethodTabs
								methods={[
									{ id: "pix", label: "Pix", note: "Aprovação imediata" },
									{ id: "card", label: "Cartão", note: "Até 6x sem juros" },
								]}
								active={selectedPaymentMethod}
								onSelect={(id) => setSelectedPaymentMethod(id as "pix" | "card")}
							/>
							{selectedPaymentMethod === "pix" ? (
								<div className="flex flex-col gap-3">
									<p className="m-0 text-[13px] leading-[1.6] text-[color:var(--sl-text-muted)]">
										Usaremos o e-mail informado acima para gerar seu código Pix. O pedido é liberado em
										segundos após o pagamento.
									</p>
									<button
										type="button"
										className="sl-btn sl-btn-buy w-full"
										disabled={isSubmitting || isUpdatingDelivery}
										onClick={() => void handlePixPayment()}
									>
										Gerar código Pix
									</button>
								</div>
							) : (
								<div className="flex flex-col gap-4">
									{checkout.isAuthenticated && savedCards.length > 0 ? (
										<div
											className="flex flex-col gap-2 p-3"
											style={{ border: "1px solid var(--sl-line-strong)" }}
										>
											<p className="sl-lbl">Cartões salvos no Mercado Pago</p>
											{savedCards.map((card) => (
												<div key={card.id} className="flex items-center justify-between gap-2 text-[13px]">
													<label className="flex items-center gap-2">
														<input
															type="radio"
															name="saved-mercado-pago-card"
															checked={selectedSavedCardId === card.id}
															onChange={() => setSelectedSavedCardId(card.id)}
														/>
														<span>
															{card.brand ?? "Cartão"} · final {card.lastFourDigits ?? "****"}
														</span>
													</label>
													<button
														type="button"
														className="text-[11px] font-black uppercase tracking-[0.16em] text-[color:var(--sl-accent)] underline"
														onClick={() => void handleRemoveSavedCard(card.id)}
													>
														Remover
													</button>
												</div>
											))}
											<button
												type="button"
												className="sl-btn sl-btn-primary w-full"
												disabled={!selectedSavedCardId || isSubmitting}
												onClick={() => void handleSavedCardPayment()}
											>
												Pagar com cartão salvo
											</button>
										</div>
									) : null}
									<SlCardBrandRow />
									{installmentPreview.length > 0 ? <SlInstallmentList options={installmentPreview} /> : null}
									<p className="m-0 text-[13px] leading-[1.6] text-[color:var(--sl-text-muted)]">
										Os dados do cartão são informados no formulário seguro do Mercado Pago e não passam pelo
										site.
									</p>
									{isLoadingPaymentBrick ? (
										<p className="m-0 text-[13px] text-[color:var(--sl-text-soft)]" role="status">
											Carregando pagamento do Mercado Pago…
										</p>
									) : null}
									<div id="mercado-pago-payment-brick" aria-busy={isLoadingPaymentBrick} />
									{checkout.isAuthenticated ? (
										<label className="flex items-start gap-2 text-[12px] leading-[1.5] text-[color:var(--sl-text-soft)]">
											<input
												type="checkbox"
												checked={savePaymentMethod}
												onChange={(event) => setSavePaymentMethod(event.currentTarget.checked)}
											/>
											<span>Salvar este cartão no Mercado Pago para compras futuras (opcional).</span>
										</label>
									) : null}
								</div>
							)}
						</>
					) : (
						<p
							className="m-0 px-3 py-2 text-[13px]"
							style={{
								border: "1px solid var(--sl-line-strong)",
								background: "var(--sl-sand)",
								color: "var(--sl-text-muted)",
							}}
						>
							Calcule a entrega antes de escolher o pagamento — o total não muda depois disso.
						</p>
					)}

					<div className="flex flex-col gap-3 border-t border-[color:var(--sl-line-hairline)] pt-5">
						<p className="m-0 text-center text-[13px] leading-[1.6] text-[color:var(--sl-text-soft)]">
							Ao concluir você concorda com os <span className="underline">termos de compra</span>. Cobrança
							única, sem assinatura.
						</p>
						{message ? (
							<SlPaymentState
								kind="declined"
								title="Não foi possível concluir o pagamento"
								body={message}
								actions={
									<>
										<button
											type="button"
											className="sl-btn h-11 px-3 text-[10px]"
											style={{ background: "var(--sl-wine)", color: "var(--sl-text-on-ink)" }}
											onClick={() => {
												setSelectedPaymentMethod("pix");
												setMessage(null);
											}}
										>
											Pagar com Pix
										</button>
										<button
											type="button"
											className="sl-btn h-11 px-3 text-[10px]"
											style={{ border: "1px solid var(--sl-wine)", color: "var(--sl-accent)" }}
											onClick={() => setMessage(null)}
										>
											Tentar outro cartão
										</button>
									</>
								}
							/>
						) : null}
						{isSubmitting ? (
							<SlPaymentState
								kind="processing"
								title={t("actions.processing")}
								body="Autorizando com o banco emissor… não feche a página."
							/>
						) : null}
					</div>
				</div>
			</section>
		</div>
	);
}

/** Numbered ink header bar for the checkout's Identificação / Entrega steps. */
function CheckoutStepHeader({ step, label }: { step: string; label: string }) {
	return (
		<div
			className="flex items-center gap-3.5 px-6 py-4"
			style={{ background: "var(--sl-ink)", color: "var(--sl-text-on-ink)" }}
		>
			<span className="inline-flex h-7 w-7 items-center justify-center text-[13px] font-black">{step}</span>
			<p className="sl-u m-0 text-[12px] tracking-[0.24em]">{label}</p>
		</div>
	);
}

/** Up to three interest-free installment rows, previewed beside the MP Brick. */
function buildInstallmentPreview(
	amountMinor: number,
	currency: string,
	locale: string,
): SlInstallmentOption[] {
	// Below R$100 the split isn't worth showing — the buyer just pays in one go.
	if (!amountMinor || amountMinor < 10000) return [];
	// Never advertise an installment smaller than R$20.
	const affordableMax = Math.max(1, Math.floor(amountMinor / 2000));
	const max = Math.min(6, affordableMax, Math.max(1, getMaxCardInstallments(amountMinor)));
	if (max <= 1) return [];
	const times = [...new Set([max, max >= 6 ? 3 : Math.max(2, Math.floor(max / 2)), 1])]
		.filter((n) => n >= 1 && n <= max)
		.sort((a, b) => b - a);
	return times.map((n) => ({
		times: `${n}x`,
		value: formatMoney({ amount: Math.round(amountMinor / n), currency, locale }),
		note: n === 1 ? "à vista" : "sem juros",
		highlight: n === max || n === 1,
	}));
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
			<label className="sl-lbl" htmlFor={id}>
				{label}
			</label>
			{children}
			<p className="m-0 min-h-4 text-[12px]" style={{ color: error ? "var(--sl-danger)" : "transparent" }}>
				{error ?? " "}
			</p>
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
			className="flex cursor-pointer items-start gap-3 p-4 text-[14px] transition-[border-color] duration-150"
			style={{
				border: `1px solid ${selected ? "var(--sl-ink)" : "var(--sl-line-strong)"}`,
				background: selected ? "var(--sl-sand)" : "transparent",
			}}
		>
			<RadioGroupItem id={id} value={value} className="mt-0.5" />
			<span className="block flex-1">
				<span className="block font-bold">{title}</span>
				<span className="mt-1 block text-[12px] leading-[1.5] text-[color:var(--sl-text-muted)]">
					{description}
				</span>
				<span
					className="mt-3 block px-3 py-2 text-[12px] leading-[1.5] text-[color:var(--sl-text-muted)]"
					style={{ background: "var(--sl-surface-card)" }}
				>
					<span className="block font-bold text-[color:var(--sl-text)]">{radioLabel}</span>
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

async function copyPixCode(code: string, setMessage: (message: string) => void) {
	try {
		if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
		await navigator.clipboard.writeText(code);
		setMessage("Código Pix copiado para a área de transferência.");
		return true;
	} catch {
		setMessage("Não foi possível copiar automaticamente. Selecione o código acima para copiar.");
		return false;
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

function toMercadoPagoPayer(buyer: TransparentCheckoutIntent["buyer"]) {
	const nameParts = normalizeBuyerName(buyer.fullName).split(" ").filter(Boolean);
	return {
		firstName: nameParts[0] ?? "",
		lastName: nameParts.slice(1).join(" "),
		email: normalizeBuyerEmail(buyer.email),
		entityType: "individual",
		identification: {
			type: getCheckoutIdentificationType(buyer.cpf),
			number: buyer.cpf.replace(/\D/g, ""),
		},
	};
}
