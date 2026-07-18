"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
	type TransparentCheckoutIntent,
	updateCheckoutBuyerData,
	updateCheckoutDeliverySelection,
	updatePaymentMethodSavingPreference,
} from "@/actions/checkout-actions";
import { MercadoPagoCheckoutForm } from "@/app/checkout/mercado-pago-checkout-form.client";
import { useTranslations } from "@/i18n/client";
import { type AppLocale, getStripeLocale } from "@/i18n/config";
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

const NEW_PAYMENT_METHOD_VALUE = "new-payment-method";
const stripePromises = new Map<string, Promise<Stripe | null>>();

function getStripePromise(publishableKey: string) {
	const existing = stripePromises.get(publishableKey);
	if (existing) return existing;
	const promise = loadStripe(publishableKey);
	stripePromises.set(publishableKey, promise);
	return promise;
}

export function CheckoutForm({
	checkout,
	locale,
}: {
	checkout: TransparentCheckoutIntent;
	locale: AppLocale;
}) {
	if (checkout.paymentProvider === "mercado_pago") {
		return (
			<div className="rounded-xl border bg-card p-6 shadow-sm">
				<MercadoPagoCheckoutForm checkout={checkout} locale={locale} />
			</div>
		);
	}

	return (
		<div className="rounded-xl border bg-card p-6 shadow-sm">
			<Elements
				stripe={getStripePromise(checkout.publishableKey)}
				options={{
					clientSecret: checkout.clientSecret!,
					locale: getStripeLocale(locale),
					appearance: {
						theme: "stripe",
						variables: {
							borderRadius: "10px",
							colorPrimary: "#111111",
							fontFamily: "inherit",
						},
					},
				}}
			>
				<CheckoutFormInner checkout={checkout} locale={locale} />
			</Elements>
		</div>
	);
}

function CheckoutFormInner({ checkout, locale }: { checkout: TransparentCheckoutIntent; locale: AppLocale }) {
	const router = useRouter();
	const stripe = useStripe();
	const elements = useElements();
	const t = useTranslations("Checkout.form");

	const [message, setMessage] = useState<string | null>(null);
	const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
	const [buyer, setBuyer] = useState(() => ({
		fullName: checkout.buyer?.fullName ?? "",
		email: checkout.buyer?.email ?? "",
		cpf: formatCpf(checkout.buyer?.cpf ?? ""),
		phone: formatCheckoutPhone(checkout.buyer?.phone ?? ""),
	}));
	const [buyerErrors, setBuyerErrors] = useState<Record<string, string>>({});
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
		checkout.savedPaymentMethods[0]?.id ?? NEW_PAYMENT_METHOD_VALUE,
	);
	const [savePaymentMethod, setSavePaymentMethod] = useState(checkout.savePaymentMethod);
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

	const selectedSavedPaymentMethod =
		selectedPaymentMethod === NEW_PAYMENT_METHOD_VALUE
			? null
			: checkout.savedPaymentMethods.find((method) => method.id === selectedPaymentMethod) || null;
	const isUsingNewPaymentMethod = !selectedSavedPaymentMethod;
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
		nextMethod: TransparentCheckoutIntent["deliveryMethod"] = selectedDeliveryMethod,
		address: AddressValue | null = nextMethod === "new-address" ? newAddress : null,
	) {
		setIsUpdatingDelivery(true);
		setDeliveryMessage(null);
		setMessage(null);

		const result = await updateCheckoutDeliverySelection({
			paymentIntentId: checkout.paymentIntentId,
			orderId: checkout.orderId,
			deliveryMethod: nextMethod,
			address: nextMethod === "new-address" ? toCheckoutAddress(address) : null,
		});

		if ("error" in result) {
			setDeliveryError(result.error);
			setIsUpdatingDelivery(false);
			return false;
		}

		setSelectedDeliveryMethod(result.deliveryMethod);
		setSelectedDeliveryAddress(toAddressValue(result.deliveryAddress));
		setDeliveryRate(result.shippingRate ?? null);
		setDeliveryError(result.shippingError);
		setAmountTotal(result.amountTotal);
		setIsUpdatingDelivery(false);
		return true;
	}

	async function handleDeliveryMethodChange(nextMethod: TransparentCheckoutIntent["deliveryMethod"]) {
		setDeliveryMessage(null);
		setMessage(null);

		if (nextMethod === "new-address") {
			setSelectedDeliveryMethod(nextMethod);
			setDeliveryError(null);
			setDeliveryRate(null);
			return;
		}

		await applyDeliverySelection(nextMethod);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!stripe || isSubmitting || isUpdatingDelivery) return;

		setIsSubmitting(true);
		setMessage(null);
		setDeliveryMessage(null);

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
			return;
		}

		const buyerResult = await updateCheckoutBuyerData({
			paymentIntentId: checkout.paymentIntentId,
			orderId: checkout.orderId,
			buyer: normalizedBuyer,
		});
		if ("error" in buyerResult) {
			setMessage(buyerResult.error);
			setIsSubmitting(false);
			return;
		}

		if (!deliveryReady || selectedDeliveryMethod === "new-address") {
			const applied = await applyDeliverySelection(selectedDeliveryMethod, newAddress);
			if (!applied) {
				setIsSubmitting(false);
				return;
			}
		}

		if (checkout.canSavePaymentMethod) {
			const preference = await updatePaymentMethodSavingPreference({
				paymentIntentId: checkout.paymentIntentId,
				savePaymentMethod: isUsingNewPaymentMethod ? savePaymentMethod : false,
			});
			if ("error" in preference) {
				setMessage(preference.error);
				setIsSubmitting(false);
				return;
			}
		}

		const returnUrl = new URL("/checkout/return", window.location.origin);
		returnUrl.searchParams.set("order", checkout.orderId);

		const confirmationResult = selectedSavedPaymentMethod
			? await stripe.confirmPayment({
					clientSecret: checkout.clientSecret!,
					confirmParams: {
						return_url: returnUrl.toString(),
						payment_method: selectedSavedPaymentMethod.id,
					},
					redirect: "if_required",
				})
			: elements
				? await stripe.confirmPayment({
						elements,
						confirmParams: {
							return_url: returnUrl.toString(),
						},
						redirect: "if_required",
					})
				: { error: { message: t("errors.formLoading") } };

		if (confirmationResult.error) {
			setMessage(confirmationResult.error.message || t("errors.confirmationFailed"));
			setIsSubmitting(false);
			return;
		}

		const checkoutStatus = normalizePaymentIntentCheckoutStatus(confirmationResult.paymentIntent?.status);
		if (checkoutStatus === "success" || checkoutStatus === "processing") {
			const paymentIntentId = confirmationResult.paymentIntent?.id || checkout.paymentIntentId;
			router.replace(
				`/checkout/processing?order=${checkout.orderId}&payment_intent=${paymentIntentId}&guest=${
					(checkout.isAuthenticated ?? false) ? "0" : "1"
				}`,
			);
			return;
		}

		router.replace(`/?checkout=${checkoutStatus}`);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<section className="space-y-4 rounded-xl border bg-background p-4">
				<div className="space-y-1">
					<h2 className="text-base font-semibold">Dados para sua compra</h2>
					<p className="text-sm leading-6 text-muted-foreground">
						Informe seus dados para concluir a compra. Sua conta será criada automaticamente e enviaremos o
						acesso por e-mail após a confirmação do pedido.
					</p>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="grid gap-2 md:col-span-2">
						<label className="text-sm font-medium" htmlFor="checkout-full-name">
							Nome completo
						</label>
						<Input
							id="checkout-full-name"
							value={buyer.fullName}
							onChange={(event) => setBuyerField("fullName", event.currentTarget.value)}
							onBlur={() => normalizeBuyerField("fullName")}
							autoComplete="name"
							required
						/>
						{buyerErrors.fullName ? <p className="text-xs text-destructive">{buyerErrors.fullName}</p> : null}
					</div>
					<div className="grid content-start gap-2">
						<label className="text-sm font-medium" htmlFor="checkout-email">
							E-mail
						</label>
						<Input
							id="checkout-email"
							type="email"
							value={buyer.email}
							onChange={(event) => setBuyerField("email", event.currentTarget.value)}
							onBlur={() => normalizeBuyerField("email")}
							autoComplete="email"
							required
						/>
						<p className={cn("min-h-4 text-xs", buyerErrors.email ? "text-destructive" : "text-transparent")}>
							{buyerErrors.email ?? " "}
						</p>
					</div>
					<div className="grid content-start gap-2">
						<label className="text-sm font-medium" htmlFor="checkout-cpf">
							CPF
						</label>
						<Input
							id="checkout-cpf"
							value={buyer.cpf}
							onChange={(event) => setBuyerField("cpf", formatCpf(event.currentTarget.value))}
							onBlur={() => normalizeBuyerField("cpf")}
							inputMode="numeric"
							maxLength={14}
							placeholder="000.000.000-00"
							required
						/>
						<p className={cn("min-h-4 text-xs", buyerErrors.cpf ? "text-destructive" : "text-transparent")}>
							{buyerErrors.cpf ?? " "}
						</p>
					</div>
					<div className="grid content-start gap-2 md:col-span-2">
						<label className="text-sm font-medium" htmlFor="checkout-phone">
							Telefone
						</label>
						<Input
							id="checkout-phone"
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
						<p className={cn("min-h-4 text-xs", buyerErrors.phone ? "text-destructive" : "text-transparent")}>
							{buyerErrors.phone ?? " "}
						</p>
					</div>
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
							idPrefix="checkout-delivery"
							value={newAddress}
							onChange={(value) => {
								setNewAddress(value);
								setDeliveryRate(null);
								setDeliveryError(null);
								setDeliveryMessage(null);
							}}
							onResolvedAddress={(value) => {
								setNewAddress(value);
								void applyDeliverySelection("new-address", value);
							}}
							countryMode="br-only"
							required
						/>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-xs leading-5 text-muted-foreground">{t("delivery.newAddress.helper")}</p>
							<Button
								type="button"
								variant="secondary"
								className="sm:w-auto"
								onClick={() => void applyDeliverySelection("new-address", newAddress)}
								disabled={isUpdatingDelivery}
							>
								{isUpdatingDelivery ? t("delivery.actions.updating") : t("delivery.actions.calculate")}
							</Button>
						</div>
					</div>
				) : null}

				{deliveryMessage ? (
					<p
						className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
						role="alert"
					>
						{deliveryMessage}
					</p>
				) : deliveryError ? (
					<p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
						{deliveryError}
					</p>
				) : null}

				<div className="grid gap-3 rounded-lg border bg-background p-4 text-sm">
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">{t("delivery.summary.shipping")}</span>
						<span className="font-medium">
							{deliveryRate
								? formatMoney({
										amount: deliveryRate.fixed_amount.amount,
										currency: checkout.currency,
										locale,
									})
								: t("delivery.summary.pending")}
						</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">{t("delivery.summary.eta")}</span>
						<span className="font-medium">
							{deliveryRate?.estimated_days != null
								? t("delivery.summary.days", {
										count: deliveryRate.estimated_days,
									})
								: t("delivery.summary.pending")}
						</span>
					</div>
					<div className="flex items-center justify-between gap-4 border-t pt-3">
						<span className="font-semibold">{t("delivery.summary.total")}</span>
						<span className="text-base font-semibold">
							{formatMoney({
								amount: amountTotal,
								currency: checkout.currency,
								locale,
							})}
						</span>
					</div>
				</div>
			</section>

			{checkout.savedPaymentMethods.length > 0 ? (
				<div className="space-y-3 rounded-xl border bg-background p-4">
					<div className="space-y-1">
						<h2 className="text-sm font-semibold">{t("paymentMethod.title")}</h2>
						<p className="text-xs leading-5 text-muted-foreground">{t("paymentMethod.description")}</p>
					</div>
					<RadioGroup
						value={selectedPaymentMethod}
						onValueChange={setSelectedPaymentMethod}
						className="gap-3"
					>
						{checkout.savedPaymentMethods.map((method) => (
							<label
								key={method.id}
								htmlFor={method.id}
								className={cn(
									"flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors",
									selectedPaymentMethod === method.id && "border-foreground bg-muted/30",
								)}
							>
								<RadioGroupItem id={method.id} value={method.id} className="mt-0.5" />
								<span className="block flex-1">
									<span className="block font-medium">
										{method.card
											? `${formatBrand(method.card.brand)} •••• ${method.card.last4}`
											: t("paymentMethod.selectedFallback")}
									</span>
									<span className="mt-1 block text-xs leading-5 text-muted-foreground">
										{method.card
											? t("paymentMethod.expires", {
													expiry: formatExpiry(method.card.expMonth, method.card.expYear),
												})
											: method.billingDetails?.email || method.billingDetails?.name || ""}
									</span>
								</span>
							</label>
						))}
						<DeliveryOptionCard
							id={NEW_PAYMENT_METHOD_VALUE}
							value={NEW_PAYMENT_METHOD_VALUE as TransparentCheckoutIntent["deliveryMethod"]}
							selected={selectedPaymentMethod === NEW_PAYMENT_METHOD_VALUE}
							title={t("paymentMethod.useNew")}
							description={t("paymentMethod.useNewDescription")}
							summary={t("paymentMethod.selectedFallback")}
							radioLabel={t("paymentMethod.selectedDescription")}
						/>
					</RadioGroup>
				</div>
			) : null}

			{isUsingNewPaymentMethod ? (
				<PaymentElement
					options={{
						layout: "tabs",
					}}
				/>
			) : null}

			{checkout.canSavePaymentMethod && isUsingNewPaymentMethod ? (
				<label className="flex gap-3 rounded-lg border bg-background p-4 text-sm">
					<input
						type="checkbox"
						checked={savePaymentMethod}
						onChange={(event) => setSavePaymentMethod(event.currentTarget.checked)}
						className="mt-1 h-4 w-4 rounded border-gray-300"
					/>
					<span>
						<span className="block font-medium">{t("saveMethod.title")}</span>
						<span className="mt-1 block text-xs leading-5 text-muted-foreground">
							{t("saveMethod.description")}
						</span>
					</span>
				</label>
			) : null}

			{message ? (
				<p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
					{message}
				</p>
			) : null}

			<Button
				type="submit"
				className="h-11 w-full"
				disabled={!stripe || (!selectedSavedPaymentMethod && !elements) || isSubmitting || isUpdatingDelivery}
			>
				{isSubmitting ? t("actions.processing") : "Finalizar compra"}
			</Button>
			<p className="text-center text-xs text-muted-foreground">{t("securityNotice")}</p>
		</form>
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

function formatBrand(brand: string) {
	return brand
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function formatExpiry(month: number, year: number) {
	return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
}

function normalizePaymentIntentCheckoutStatus(status?: string) {
	if (!status) return "processing";
	if (status === "succeeded") return "success";
	if (status === "canceled") return "cancel";
	if (
		status === "requires_payment_method" ||
		status === "requires_action" ||
		status === "requires_confirmation" ||
		status === "requires_capture"
	) {
		return "requires_payment_method";
	}
	return status;
}
