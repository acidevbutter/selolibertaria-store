"use client";

import { Copy } from "lucide-react";
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
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { RadioGroup, RadioGroupItem } from "@/ui/shadcn/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/ui/shadcn/tooltip";

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
	const [isPixCopyTooltipOpen, setIsPixCopyTooltipOpen] = useState(false);
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
				{deliveryRate ? (
					<div className="rounded-lg border bg-muted/20 px-3 py-3 text-sm">
						<div className="flex items-start justify-between gap-4">
							<div>
								<span className="block font-medium">Frete</span>
								<span className="block text-xs text-muted-foreground">
									{deliveryRate.providerLabel}
									{deliveryRate.serviceName ? ` · ${deliveryRate.serviceName}` : ""}
									{deliveryRate.estimated_days
										? ` · até ${deliveryRate.estimated_days} ${deliveryRate.estimated_days === 1 ? "dia útil" : "dias úteis"}`
										: ""}
								</span>
							</div>
							<span className="font-medium">
								{formatMoney({
									amount: deliveryRate.fixed_amount.amount,
									currency: deliveryRate.fixed_amount.currency,
									locale,
								})}
							</span>
						</div>
					</div>
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
						Escolha Pix ou cartão no formulário seguro do Mercado Pago. Dados do cartão não passam pelo site.
					</p>
				</div>
				{pixPayment ? (
					<div className="flex flex-col items-center space-y-4 rounded-lg border bg-muted/20 p-4 text-center">
						<p className="text-sm font-medium">Pix gerado. Pague pelo QR Code ou copie o código abaixo.</p>
						{pixPayment.qrCodeBase64 ? (
							<img
								alt="QR Code Pix"
								className="h-56 w-56 bg-white p-2"
								src={`data:image/png;base64,${pixPayment.qrCodeBase64}`}
							/>
						) : null}
						{pixPayment.qrCode ? (
							<div className="w-full max-w-xl rounded-lg border bg-background/70 p-3 text-left shadow-sm">
								<div className="mb-2 flex items-center justify-between gap-3">
									<label className="text-xs font-medium" htmlFor="pix-copy-paste-code">
										Código Pix copia e cola
									</label>
									<TooltipProvider delayDuration={0}>
										<Tooltip open={isPixCopyTooltipOpen} onOpenChange={setIsPixCopyTooltipOpen}>
											<TooltipTrigger asChild>
												<Button
													type="button"
													variant="outline"
													size="icon"
													aria-label="Copiar código Pix"
													onClick={() => {
														void copyPixCode(pixPayment.qrCode!, setPixCopyMessage).then((copied) => {
															if (!copied) return;
															setIsPixCopyTooltipOpen(true);
															window.setTimeout(() => setIsPixCopyTooltipOpen(false), 1800);
														});
													}}
												>
													<Copy aria-hidden="true" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												{pixCopyMessage === "Código Pix copiado." ? "Copiado!" : "Copiar código Pix"}
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
								<textarea
									id="pix-copy-paste-code"
									readOnly
									className="min-h-24 w-full resize-none rounded-md border-0 bg-muted/50 p-3 font-mono text-xs leading-relaxed"
									value={pixPayment.qrCode}
								/>
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
						<div className="flex flex-col items-center gap-3">
							{pixPayment.ticketUrl ? (
								<a className="text-sm underline" href={pixPayment.ticketUrl} rel="noreferrer" target="_blank">
									Abrir Pix no Mercado Pago
								</a>
							) : null}
							<Button
								type="button"
								disabled={isCheckingPixPayment}
								onClick={() => void handlePixPaymentCheck()}
							>
								{isCheckingPixPayment ? "Verificando pagamento…" : "Já paguei"}
							</Button>
						</div>
						{pixPaymentMessage ? (
							<p className="text-xs text-muted-foreground" role="status">
								{pixPaymentMessage}
							</p>
						) : null}
					</div>
				) : deliveryReady ? (
					<div className="space-y-3">
						<RadioGroup
							value={selectedPaymentMethod}
							onValueChange={(value) => setSelectedPaymentMethod(value as "pix" | "card")}
							className="grid gap-3 sm:grid-cols-2"
						>
							<PaymentMethodOption
								id="checkout-payment-pix"
								value="pix"
								selected={selectedPaymentMethod === "pix"}
								title="Pix"
								description="QR Code e código copia e cola"
							/>
							<PaymentMethodOption
								id="checkout-payment-card"
								value="card"
								selected={selectedPaymentMethod === "card"}
								title="Cartão"
								description="Crédito ou débito no formulário seguro"
							/>
						</RadioGroup>
						{selectedPaymentMethod === "pix" ? (
							<div className="rounded-lg border bg-muted/20 p-3">
								<p className="text-sm font-medium">Pix</p>
								<p className="mt-1 text-xs leading-5 text-muted-foreground">
									Usaremos o e-mail informado acima para gerar seu código Pix.
								</p>
								<Button
									type="button"
									className="mt-3"
									disabled={isSubmitting || isUpdatingDelivery}
									onClick={() => void handlePixPayment()}
								>
									Gerar código Pix
								</Button>
							</div>
						) : (
							<div className="space-y-3 rounded-lg border bg-muted/20 p-3">
								<p className="text-sm font-medium">Cartão</p>
								{checkout.isAuthenticated && savedCards.length > 0 ? (
									<div className="space-y-2 rounded-md border bg-background p-3">
										<p className="text-xs font-medium">Cartões salvos no Mercado Pago</p>
										{savedCards.map((card) => (
											<div key={card.id} className="flex items-center justify-between gap-2 text-xs">
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
													className="underline"
													onClick={() => void handleRemoveSavedCard(card.id)}
												>
													Remover
												</button>
											</div>
										))}
										<Button
											type="button"
											className="w-full"
											disabled={!selectedSavedCardId || isSubmitting}
											onClick={() => void handleSavedCardPayment()}
										>
											Pagar com cartão salvo
										</Button>
									</div>
								) : null}
								<p className="text-xs leading-5 text-muted-foreground">
									Informe os dados do cartão no formulário seguro do Mercado Pago.
								</p>
								{isLoadingPaymentBrick ? (
									<p className="text-sm text-muted-foreground" role="status">
										Carregando pagamento do Mercado Pago…
									</p>
								) : null}
								<div id="mercado-pago-payment-brick" aria-busy={isLoadingPaymentBrick} />
								{checkout.isAuthenticated ? (
									<label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
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
				"flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
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
