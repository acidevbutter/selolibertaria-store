"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/i18n/client";
import type { Cart } from "@/lib/commerce-types";
import type { SupportedCurrency } from "@/lib/currency";
import { normalizePhoneParts } from "@/lib/location/countries";
import { AddressFields, type AddressValue } from "@/ui/auth/address-fields.client";
import { CurrencySelect } from "@/ui/auth/currency-select";
import { PhoneInput, type PhoneValue } from "@/ui/auth/phone-input.client";
import { PasswordInput } from "@/ui/shadcn/password-input";

type Props = {
	cart: Cart | null;
	defaultCountry: string;
	defaultCurrency: SupportedCurrency;
	pending: boolean;
	onRegistered: (email: string) => void;
};

function createInitialAddress(defaultCountry: string): AddressValue {
	return {
		line1: "",
		line2: "",
		number: "",
		complement: "",
		district: "",
		city: "",
		state: "",
		postalCode: "",
		country: defaultCountry,
	};
}

export function RegisterForm({ cart, defaultCountry, defaultCurrency, pending, onRegistered }: Props) {
	const t = useTranslations("Register");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState<PhoneValue>(() => normalizePhoneParts(defaultCountry, ""));
	const [address, setAddress] = useState<AddressValue>(() => createInitialAddress(defaultCountry));
	const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrency>(defaultCurrency);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [marketingOptIn, setMarketingOptIn] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

	const strength = useMemo(
		() => ({
			length: password.length >= 10,
			upper: /[A-Z]/.test(password),
			lower: /[a-z]/.test(password),
			digit: /[0-9]/.test(password),
			special: /[^A-Za-z0-9]/.test(password),
		}),
		[password],
	);

	const isStrong = strength.length && strength.upper && strength.lower && strength.digit && strength.special;
	const normalizedEmail = email.trim().toLowerCase();

	useEffect(() => {
		if (!normalizedEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
			setEmailStatus("idle");
			return;
		}
		const controller = new AbortController();
		setEmailStatus("checking");
		const timeout = setTimeout(async () => {
			try {
				const res = await fetch("/api/auth/email-available", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email: normalizedEmail }),
					signal: controller.signal,
				});
				if (!res.ok) {
					setEmailStatus("idle");
					return;
				}
				const data = (await res.json()) as { available?: boolean };
				setEmailStatus(data.available ? "available" : "taken");
			} catch {
				setEmailStatus("idle");
			}
		}, 350);
		return () => {
			controller.abort();
			clearTimeout(timeout);
		};
	}, [normalizedEmail]);

	async function storeCredentialForBrowser() {
		if (typeof window === "undefined" || !("credentials" in navigator)) return;
		const PasswordCredentialCtor = (
			window as Window & {
				PasswordCredential?: new (data: { id: string; password: string; name?: string }) => Credential;
			}
		).PasswordCredential;
		if (!PasswordCredentialCtor) return;
		try {
			const credential = new PasswordCredentialCtor({
				id: normalizedEmail,
				password,
				name: name || undefined,
			});
			await navigator.credentials.store(credential);
		} catch (storeError) {
			console.warn("[register] browser credential store failed", storeError);
		}
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		if (!name.trim()) {
			setError(t("errors.nameRequired"));
			return;
		}
		if (!normalizedEmail) {
			setError(t("errors.emailInvalid"));
			return;
		}
		if (emailStatus === "taken") {
			setError(t("errors.emailTaken"));
			return;
		}
		if (!phone.e164) {
			setError(t("errors.phoneRequired"));
			return;
		}
		if (
			!address.line1 ||
			!address.number ||
			!address.city ||
			!address.state ||
			!address.postalCode ||
			!address.country
		) {
			setError(t("errors.addressRequired"));
			return;
		}
		if (!isStrong) {
			setError(t("errors.passwordWeak"));
			return;
		}
		if (password !== confirmPassword) {
			setError(t("errors.passwordMismatch"));
			return;
		}

		const payload: Record<string, unknown> = {
			name: name.trim(),
			email: normalizedEmail,
			password,
			phone: phone.e164,
			phoneDetails: {
				country: phone.country,
				dialCode: phone.dialCode,
				national: phone.national,
				display: phone.display,
			},
			address,
			preferredCurrency,
			marketing: {
				email: {
					optIn: marketingOptIn,
				},
			},
		};
		if (cart?.items?.length) {
			payload.cart = {
				items: cart.items.map((item) => ({
					productId: item.productId,
					variantId: item.variantId,
					quantity: item.quantity,
				})),
				couponCode: cart.couponCode ?? undefined,
			};
		}

		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const data = (await res.json().catch(() => ({}))) as { error?: string };
				setError(typeof data.error === "string" ? data.error : t("errors.failed"));
				return;
			}
			await storeCredentialForBrowser();
			onRegistered(normalizedEmail);
		} catch {
			setError(t("errors.unexpected"));
		}
	}

	return (
		<form onSubmit={handleSubmit} autoComplete="on">
			<div className="grid gap-6">
				{error ? (
					<p className="text-sm rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive lg:col-span-2">
						{error}
					</p>
				) : null}
				<div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
					<section className="grid gap-4 rounded-xl border border-border/70 bg-card/60 p-4 md:p-5">
						<div className="space-y-1">
							<h3 className="text-base font-semibold">{t("sections.account.title")}</h3>
							<p className="text-sm text-muted-foreground">{t("sections.account.description")}</p>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="register-name">{t("fields.name")}</Label>
							<Input
								id="register-name"
								name="name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								autoComplete="name"
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="register-email">{t("fields.email")}</Label>
							<Input
								id="register-email"
								name="email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								autoComplete="username"
								required
							/>
							{emailStatus === "checking" ? (
								<p className="text-xs text-muted-foreground">{t("email.checking")}</p>
							) : null}
							{emailStatus === "available" ? (
								<p className="text-xs text-green-600">{t("email.available")}</p>
							) : null}
							{emailStatus === "taken" ? (
								<p className="text-xs text-destructive">{t("email.taken")}</p>
							) : null}
						</div>
						<PhoneInput
							idPrefix="register-phone"
							label={t("fields.phone")}
							value={phone}
							onChange={setPhone}
							required
						/>
						<div className="grid gap-2">
							<Label htmlFor="register-preferred-currency">{t("fields.preferredCurrency")}</Label>
							<CurrencySelect
								id="register-preferred-currency"
								value={preferredCurrency}
								onChange={setPreferredCurrency}
							/>
							<p className="text-xs text-muted-foreground">{t("fields.preferredCurrencyHint")}</p>
						</div>
					</section>

					<section className="grid gap-4 rounded-xl border border-border/70 bg-card/60 p-4 md:p-5">
						<div className="space-y-1">
							<h3 className="text-base font-semibold">{t("sections.address.title")}</h3>
							<p className="text-sm text-muted-foreground">{t("sections.address.description")}</p>
						</div>
						<AddressFields idPrefix="register-address" value={address} onChange={setAddress} required />
					</section>
				</div>
				<section className="grid gap-4 rounded-xl border border-border/70 bg-card/60 p-4 md:p-5">
					<div className="space-y-1">
						<h3 className="text-base font-semibold">{t("sections.security.title")}</h3>
						<p className="text-sm text-muted-foreground">{t("sections.security.description")}</p>
					</div>
					<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
						<div className="grid gap-2">
							<Label htmlFor="register-password">{t("fields.password")}</Label>
							<PasswordInput
								id="register-password"
								name="password"
								value={password}
								onChange={(event) => setPassword((event.target as HTMLInputElement).value)}
								autoComplete="new-password"
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="register-confirm-password">{t("fields.confirmPassword")}</Label>
							<Input
								id="register-confirm-password"
								name="confirm"
								type="password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								autoComplete="new-password"
								required
							/>
						</div>
					</div>
					<div className="text-sm text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-6">
						<div>
							<div>{t("passwordStrength.title")}</div>
							<ul className="ml-5 list-disc">
								<li className={strength.length ? "text-green-500" : "text-red-500"}>
									{t("passwordStrength.rules.length")}
								</li>
								<li className={strength.upper ? "text-green-500" : "text-red-500"}>
									{t("passwordStrength.rules.upper")}
								</li>
								<li className={strength.lower ? "text-green-500" : "text-red-500"}>
									{t("passwordStrength.rules.lower")}
								</li>
								<li className={strength.digit ? "text-green-500" : "text-red-500"}>
									{t("passwordStrength.rules.digit")}
								</li>
								<li className={strength.special ? "text-green-500" : "text-red-500"}>
									{t("passwordStrength.rules.special")}
								</li>
							</ul>
							<label className="mt-4 flex items-start gap-3 rounded-lg border bg-background/70 p-3 text-left text-sm">
								<input
									type="checkbox"
									checked={marketingOptIn}
									onChange={(event) => setMarketingOptIn(event.currentTarget.checked)}
									className="mt-1 h-4 w-4 rounded border-gray-300"
								/>
								<span>
									<span className="block font-medium text-foreground">{t("marketing.title")}</span>
									<span className="mt-1 block text-xs leading-5 text-muted-foreground">
										{t("marketing.description")}
									</span>
								</span>
							</label>
						</div>
						<Button
							type="submit"
							className="mt-4 w-full lg:mt-0 lg:w-auto lg:min-w-52"
							disabled={pending || emailStatus === "taken" || !isStrong || password !== confirmPassword}
						>
							{pending ? t("actions.submitting") : t("actions.createAccount")}
						</Button>
					</div>
				</section>
			</div>
		</form>
	);
}
