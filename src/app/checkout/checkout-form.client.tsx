"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
	type TransparentCheckoutIntent,
	updateCheckoutDeliverySelection,
	updatePaymentMethodSavingPreference,
} from "@/actions/checkout-actions";
import { useTranslations } from "@/i18n/client";
import { type AppLocale, getStripeLocale } from "@/i18n/config";
import { cn, formatMoney } from "@/lib/utils";
import { AddressFields, type AddressValue } from "@/ui/auth/address-fields.client";
import { Button } from "@/ui/shadcn/button";
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
	return (
		<div className="rounded-xl border bg-card p-6 shadow-sm">
			<Elements
				stripe={getStripePromise(checkout.publishableKey)}
				options={{
					clientSecret: checkout.clientSecret,
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
				<CheckoutFormInner
					clientSecret={checkout.clientSecret}
					deliveryAddress={checkout.deliveryAddress ?? null}
					deliveryMethod={checkout.deliveryMethod}
					initialAmountTotal={checkout.amountTotal}
					initialShippingError={checkout.shippingError ?? null}
					initialShippingRate={checkout.shippingRate ?? null}
					currency={checkout.currency}
					locale={locale}
					canSavePaymentMethod={checkout.canSavePaymentMethod}
					orderId={checkout.orderId}
					paymentIntentId={checkout.paymentIntentId}
					savePaymentMethod={checkout.savePaymentMethod}
					savedPaymentMethods={checkout.savedPaymentMethods}
				/>
			</Elements>
		</div>
	);
}

function CheckoutFormInner({
	clientSecret,
	deliveryAddress: initialDeliveryAddress,
	deliveryMethod: initialDeliveryMethod,
	initialAmountTotal,
	initialShippingError,
	initialShippingRate,
	currency,
	locale,
	canSavePaymentMethod,
	orderId,
	paymentIntentId,
	savePaymentMethod: initialSavePaymentMethod,
	savedPaymentMethods,
}: {
	clientSecret: string;
	deliveryAddress: TransparentCheckoutIntent["deliveryAddress"] | null;
	deliveryMethod: TransparentCheckoutIntent["deliveryMethod"];
	initialAmountTotal: number;
	initialShippingError: string | null;
	initialShippingRate: TransparentCheckoutIntent["shippingRate"] | null;
	currency: string;
	locale: AppLocale;
	canSavePaymentMethod: boolean;
	orderId: string;
	paymentIntentId: string;
	savePaymentMethod: boolean;
	savedPaymentMethods: TransparentCheckoutIntent["savedPaymentMethods"];
}) {
	const router = useRouter();
	const stripe = useStripe();
	const elements = useElements();
	const t = useTranslations("Checkout.form");
	const [message, setMessage] = useState<string | null>(null);
	const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
	const [savePaymentMethod, setSavePaymentMethod] = useState(initialSavePaymentMethod);
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(NEW_PAYMENT_METHOD_VALUE);
	const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState(initialDeliveryMethod);
	const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(
		toAddressValue(initialDeliveryAddress),
	);
	const [deliveryRate, setDeliveryRate] = useState(initialShippingRate);
	const [deliveryError, setDeliveryError] = useState(initialShippingError);
	const [amountTotal, setAmountTotal] = useState(initialAmountTotal);
	const [newAddress, setNewAddress] = useState<AddressValue>(
		initialDeliveryMethod === "new-address" ? toAddressValue(initialDeliveryAddress) : emptyAddressValue(),
	);
	const selectedSavedPaymentMethod =
		selectedPaymentMethod === NEW_PAYMENT_METHOD_VALUE
			? null
			: savedPaymentMethods.find((method) => method.id === selectedPaymentMethod) || null;
	const isUsingNewPaymentMethod = !selectedSavedPaymentMethod;
	const hasSavedAddress = Boolean(initialDeliveryAddress);
	const selectedDeliverySummary = getDeliverySummary(
		selectedDeliveryMethod,
		selectedDeliveryMethod === "new-address" ? newAddress : selectedDeliveryAddress,
		{
			pickup: t("delivery.pickup.shortSummary"),
			pending: t("delivery.pendingSummary"),
		},
	);
	const deliveryReady = Boolean(deliveryRate);

	async function applyDeliverySelection(
		nextMethod: TransparentCheckoutIntent["deliveryMethod"] = selectedDeliveryMethod,
		address: AddressValue | null = nextMethod === "new-address" ? newAddress : null,
	) {
		setIsUpdatingDelivery(true);
		setDeliveryMessage(null);
		setMessage(null);
		const result = await updateCheckoutDeliverySelection({
			paymentIntentId,
			orderId,
			deliveryMethod: nextMethod,
			address: nextMethod === "new-address" ? toCheckoutAddress(address) : null,
		});

		if ("error" in result) {
			setDeliveryError(result.error);
			setIsUpdatingDelivery(false);
			return false;
		}
		if ("requireAuth" in result) {
			router.replace("/login?next=checkout");
			setIsUpdatingDelivery(false);
			return false;
		}

		setSelectedDeliveryMethod(result.deliveryMethod);
		setSelectedDeliveryAddress(toAddressValue(result.deliveryAddress));
		setDeliveryRate(result.shippingRate);
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

		if (!deliveryReady || selectedDeliveryMethod === "new-address") {
			const applied = await applyDeliverySelection(selectedDeliveryMethod, newAddress);
			if (!applied) {
				setIsSubmitting(false);
				return;
			}
		}

		if (canSavePaymentMethod) {
			const preference = await updatePaymentMethodSavingPreference({
				paymentIntentId,
				savePaymentMethod: isUsingNewPaymentMethod ? savePaymentMethod : false,
			});
			if ("error" in preference) {
				setMessage(preference.error);
				setIsSubmitting(false);
				return;
			}
		}

		const returnUrl = new URL("/checkout/return", window.location.origin);
		returnUrl.searchParams.set("order", orderId);

		const confirmationResult = selectedSavedPaymentMethod
			? await stripe.confirmPayment({
					clientSecret,
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
			router.replace(`/checkout/processing?order=${orderId}`);
			return;
		}

		router.replace(`/?checkout=${checkoutStatus}`);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
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
					{hasSavedAddress && initialDeliveryAddress ? (
						<DeliveryOptionCard
							id="saved-address"
							value="saved-address"
							selected={selectedDeliveryMethod === "saved-address"}
							title={t("delivery.savedAddress.title")}
							description={t("delivery.savedAddress.description")}
							summary={
								selectedDeliveryMethod === "saved-address"
									? selectedDeliverySummary
									: formatAddressBrief(initialDeliveryAddress)
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
										currency,
										locale,
									})
								: t("delivery.summary.pending")}
						</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">{t("delivery.summary.eta")}</span>
						<span className="font-medium">
							{deliveryRate?.estimated_days != null
								? t("delivery.summary.days", { count: deliveryRate.estimated_days })
								: t("delivery.summary.pending")}
						</span>
					</div>
					<div className="flex items-center justify-between gap-4 border-t pt-3">
						<span className="font-semibold">{t("delivery.summary.total")}</span>
						<span className="text-base font-semibold">
							{formatMoney({ amount: amountTotal, currency, locale })}
						</span>
					</div>
				</div>
			</section>
			{savedPaymentMethods.length > 0 && (
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
						{savedPaymentMethods.map((method) => (
							<label
								key={method.id}
								htmlFor={method.id}
								className={cn(
									"flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors",
									selectedPaymentMethod === method.id && "border-foreground bg-muted/30",
								)}
							>
								<RadioGroupItem id={method.id} value={method.id} className="mt-0.5" />
								<span className="block">
									<span className="block font-medium">
										{method.card
											? t("paymentMethod.savedCard", {
													brand: formatBrand(method.card.brand),
													last4: method.card.last4,
												})
											: t("paymentMethod.savedFallback")}
									</span>
									{method.card && (
										<span className="mt-1 block text-xs leading-5 text-muted-foreground">
											{t("paymentMethod.expires", {
												expiry: formatExpiry(method.card.expMonth, method.card.expYear),
											})}
										</span>
									)}
								</span>
							</label>
						))}
						<label
							htmlFor={NEW_PAYMENT_METHOD_VALUE}
							className={cn(
								"flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors",
								isUsingNewPaymentMethod && "border-foreground bg-muted/30",
							)}
						>
							<RadioGroupItem
								id={NEW_PAYMENT_METHOD_VALUE}
								value={NEW_PAYMENT_METHOD_VALUE}
								className="mt-0.5"
							/>
							<span className="block">
								<span className="block font-medium">{t("paymentMethod.useNew")}</span>
								<span className="mt-1 block text-xs leading-5 text-muted-foreground">
									{t("paymentMethod.useNewDescription")}
								</span>
							</span>
						</label>
					</RadioGroup>
				</div>
			)}
			{isUsingNewPaymentMethod ? (
				<PaymentElement
					options={{
						layout: "tabs",
					}}
				/>
			) : (
				<div className="rounded-lg border bg-background p-4 text-sm">
					<p className="font-medium">
						{selectedSavedPaymentMethod?.card
							? t("paymentMethod.savedCard", {
									brand: formatBrand(selectedSavedPaymentMethod.card.brand),
									last4: selectedSavedPaymentMethod.card.last4,
								})
							: t("paymentMethod.selectedFallback")}
					</p>
					<p className="mt-1 text-xs leading-5 text-muted-foreground">
						{t("paymentMethod.selectedDescription")}
					</p>
				</div>
			)}
			{canSavePaymentMethod && isUsingNewPaymentMethod && (
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
			)}
			{message && (
				<p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
					{message}
				</p>
			)}
			<Button
				type="submit"
				className="h-11 w-full"
				disabled={!stripe || (!selectedSavedPaymentMethod && !elements) || isSubmitting || isUpdatingDelivery}
			>
				{isSubmitting
					? t("actions.processing")
					: selectedSavedPaymentMethod
						? t("actions.payWithSavedCard")
						: t("actions.payNow")}
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
	value: TransparentCheckoutIntent["deliveryMethod"];
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
		...(address
			? {
					line1: address.line1 ?? "",
					line2: address.line2 ?? "",
					number: address.number ?? "",
					complement: address.complement ?? "",
					district: address.district ?? "",
					city: address.city ?? "",
					state: address.state ?? "",
					postalCode: address.postalCode ?? "",
					country: address.country?.toUpperCase() || "BR",
				}
			: {}),
	};
}

function toCheckoutAddress(address: AddressValue | null): TransparentCheckoutIntent["deliveryAddress"] {
	if (!address) return null;
	return {
		line1: address.line1.trim(),
		line2: address.line2.trim() || null,
		number: address.number.trim(),
		complement: address.complement.trim() || null,
		district: address.district.trim(),
		city: address.city.trim(),
		state: address.state.trim(),
		postalCode: address.postalCode.trim(),
		country: address.country.trim().toUpperCase(),
	};
}

function formatAddressBrief(address: TransparentCheckoutIntent["deliveryAddress"] | null | undefined) {
	if (!address) return "";
	return [
		address.line1,
		address.number,
		address.district,
		`${address.city ?? ""} - ${address.state ?? ""}`,
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
