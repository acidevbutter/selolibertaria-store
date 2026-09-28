"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "@/i18n/client";
import type { Cart } from "@/lib/commerce-types";
import type { SupportedCurrency } from "@/lib/currency";
import { normalizePhoneParts } from "@/lib/location/countries";
import { cn } from "@/lib/utils";
import { AddressFields, type AddressValue } from "@/ui/auth/address-fields.client";
import { CurrencySelect } from "@/ui/auth/currency-select";
import { PhoneInput, type PhoneValue } from "@/ui/auth/phone-input.client";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { PasswordInput } from "@/ui/shadcn/password-input";

type Props = {
	cart: Cart | null;
	defaultCountry: string;
	defaultCurrency: SupportedCurrency;
	pending: boolean;
	onRegistered: (email: string) => void;
};

type RegisterStep = 1 | 2 | 3;

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

const fieldClassName =
	"h-12 rounded-none border-[color:var(--editorial-border)] bg-transparent px-4 text-base text-[color:var(--editorial-ink)] shadow-none placeholder:text-[color:var(--editorial-muted)] focus-visible:ring-0 focus-visible:border-[color:var(--editorial-ink)]";

const registerSteps: RegisterStep[] = [1, 2, 3];

export function RegisterForm({ cart, defaultCountry, defaultCurrency, pending, onRegistered }: Props) {
	const t = useTranslations("Register");
	const [step, setStep] = useState<RegisterStep>(1);
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
	const [submitting, setSubmitting] = useState(false);

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

	function validateStepOne() {
		if (!name.trim()) return t("errors.nameRequired");
		if (!normalizedEmail) return t("errors.emailInvalid");
		if (emailStatus === "taken") return t("errors.emailTaken");
		if (!phone.e164) return t("errors.phoneRequired");
		if (!isStrong) return t("errors.passwordWeak");
		if (password !== confirmPassword) return t("errors.passwordMismatch");
		return null;
	}

	function validateStepTwo() {
		if (
			!address.line1 ||
			!address.number ||
			!address.city ||
			!address.state ||
			!address.postalCode ||
			!address.country
		) {
			return t("errors.addressRequired");
		}
		return null;
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		const stepOneError = validateStepOne();
		if (stepOneError) {
			setStep(1);
			setError(stepOneError);
			return;
		}

		const stepTwoError = validateStepTwo();
		if (stepTwoError) {
			setStep(2);
			setError(stepTwoError);
			return;
		}

		if (submitting) return;
		setSubmitting(true);

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
				if (res.status === 409) {
					setError(t("errors.emailTaken"));
					return;
				}
				setError(t("errors.failed"));
				return;
			}
			await storeCredentialForBrowser();
			onRegistered(normalizedEmail);
		} catch {
			setError(t("errors.unexpected"));
		} finally {
			setSubmitting(false);
		}
	}

	function goNext() {
		setError(null);
		if (step === 1) {
			const issue = validateStepOne();
			if (issue) {
				setError(issue);
				return;
			}
			setStep(2);
			return;
		}
		if (step === 2) {
			const issue = validateStepTwo();
			if (issue) {
				setError(issue);
				return;
			}
			setStep(3);
		}
	}

	const submitDisabled =
		pending || submitting || emailStatus === "taken" || !isStrong || password !== confirmPassword;
	const stepMeta: Record<RegisterStep, { label: string; helper: string }> = {
		1: {
			label: t("steps.1.label"),
			helper: t("steps.1.helper"),
		},
		2: {
			label: t("steps.2.label"),
			helper: t("steps.2.helper"),
		},
		3: {
			label: t("steps.3.label"),
			helper: t("steps.3.helper"),
		},
	};

	return (
		<form onSubmit={handleSubmit} autoComplete="on" className="space-y-8">
			<div className="space-y-4">
				<p className="text-3xl font-black tracking-[-0.04em] text-[color:var(--editorial-ink)]">
					{stepMeta[step].label}
				</p>
				<div className="grid grid-cols-3 gap-6">
					{registerSteps.map((key) => {
						const active = key === step;
						const complete = key < step;
						return (
							<span
								key={key}
								className={cn(
									"h-px w-full",
									active || complete
										? "bg-[color:var(--editorial-accent)]"
										: "bg-[color:var(--editorial-border)]",
								)}
							/>
						);
					})}
				</div>
				{stepMeta[step].helper ? (
					<p className="max-w-[32rem] text-sm leading-7 text-[color:var(--editorial-muted)]">
						{stepMeta[step].helper}
					</p>
				) : null}
			</div>

			{error ? (
				<p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</p>
			) : null}

			{step === 1 ? (
				<div className="grid gap-5">
					<div className="grid gap-2">
						<Label
							htmlFor="register-name"
							className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]"
						>
							{t("fields.name")}
						</Label>
						<Input
							id="register-name"
							name="name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							autoComplete="name"
							required
							className={fieldClassName}
						/>
					</div>

					<div className="grid gap-2">
						<Label
							htmlFor="register-email"
							className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]"
						>
							{t("fields.email")}
						</Label>
						<Input
							id="register-email"
							name="email"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							autoComplete="username"
							required
							className={fieldClassName}
						/>
						{emailStatus === "checking" ? (
							<p className="text-xs text-[color:var(--editorial-muted)]">{t("email.checking")}</p>
						) : null}
						{emailStatus === "available" ? (
							<p className="text-xs text-green-600">{t("email.available")}</p>
						) : null}
						{emailStatus === "taken" ? <p className="text-xs text-destructive">{t("email.taken")}</p> : null}
					</div>

					<PhoneInput
						idPrefix="register-phone"
						label={t("fields.phone")}
						value={phone}
						onChange={setPhone}
						required
					/>

					<div className="grid gap-5 lg:grid-cols-2">
						<div className="grid gap-2">
							<Label
								htmlFor="register-password"
								className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]"
							>
								{t("fields.password")}
							</Label>
							<PasswordInput
								id="register-password"
								name="password"
								value={password}
								onChange={(event) => setPassword((event.target as HTMLInputElement).value)}
								autoComplete="new-password"
								required
								className={fieldClassName}
							/>
						</div>

						<div className="grid gap-2">
							<Label
								htmlFor="register-confirm-password"
								className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]"
							>
								{t("fields.confirmPassword")}
							</Label>
							<Input
								id="register-confirm-password"
								name="confirm"
								type="password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								autoComplete="new-password"
								required
								className={fieldClassName}
							/>
						</div>
					</div>

					<div className="border-t border-[color:var(--editorial-border)] pt-4 text-sm text-[color:var(--editorial-muted)]">
						<p className="mb-2 font-medium text-[color:var(--editorial-ink)]">
							{t("passwordStrength.title")}
						</p>
						<ul className="grid gap-1">
							<li className={strength.length ? "text-green-600" : "text-[color:var(--editorial-muted)]"}>
								{t("passwordStrength.rules.length")}
							</li>
							<li className={strength.upper ? "text-green-600" : "text-[color:var(--editorial-muted)]"}>
								{t("passwordStrength.rules.upper")}
							</li>
							<li className={strength.lower ? "text-green-600" : "text-[color:var(--editorial-muted)]"}>
								{t("passwordStrength.rules.lower")}
							</li>
							<li className={strength.digit ? "text-green-600" : "text-[color:var(--editorial-muted)]"}>
								{t("passwordStrength.rules.digit")}
							</li>
							<li className={strength.special ? "text-green-600" : "text-[color:var(--editorial-muted)]"}>
								{t("passwordStrength.rules.special")}
							</li>
						</ul>
					</div>
				</div>
			) : null}

			{step === 2 ? (
				<div className="space-y-5">
					<div className="rounded-none border border-[color:var(--editorial-border)] bg-[color:rgba(216,208,196,0.16)] p-4 text-sm leading-7 text-[color:var(--editorial-muted)]">
						Você já passou pela parte principal. Agora só precisamos do endereço para entrega e acompanhamento
						dos pedidos.
					</div>
					<AddressFields
						idPrefix="register-address"
						value={address}
						onChange={setAddress}
						countryMode="br-only"
						required
					/>
				</div>
			) : null}

			{step === 3 ? (
				<div className="grid gap-6">
					<div className="grid gap-2">
						<Label
							htmlFor="register-preferred-currency"
							className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]"
						>
							{t("fields.preferredCurrency")}
						</Label>
						<CurrencySelect
							id="register-preferred-currency"
							value={preferredCurrency}
							onChange={setPreferredCurrency}
						/>
						<p className="text-xs text-[color:var(--editorial-muted)]">{t("fields.preferredCurrencyHint")}</p>
					</div>

					<label className="flex items-start gap-3 border border-[color:var(--editorial-border)] bg-[color:rgba(216,208,196,0.16)] p-4 text-left text-sm">
						<input
							type="checkbox"
							checked={marketingOptIn}
							onChange={(event) => setMarketingOptIn(event.currentTarget.checked)}
							className="mt-1 h-4 w-4 rounded border-gray-300"
						/>
						<span>
							<span className="block font-medium text-[color:var(--editorial-ink)]">
								{t("marketing.title")}
							</span>
							<span className="mt-1 block text-xs leading-6 text-[color:var(--editorial-muted)]">
								{t("marketing.description")}
							</span>
						</span>
					</label>
				</div>
			) : null}

			<div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--editorial-border)] pt-5">
				<div className="text-sm text-[color:var(--editorial-muted)]">
					{step > 1 ? (
						<button
							type="button"
							className="underline underline-offset-4 text-[color:var(--editorial-accent)]"
							onClick={() => {
								setError(null);
								setStep((prev) => Math.max(1, prev - 1) as RegisterStep);
							}}
						>
							Voltar
						</button>
					) : (
						<p>Leva menos de 2 minutos e o endereço fica só no próximo passo.</p>
					)}
				</div>

				{step < 3 ? (
					<Button
						type="button"
						onClick={goNext}
						className="h-12 rounded-none bg-[color:var(--editorial-ink)] px-8 text-xs font-black uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-ink)]/92"
					>
						{step === 1 ? t("actions.continue") : t("actions.continueToPreferences")}
					</Button>
				) : (
					<Button
						type="submit"
						className="h-12 rounded-none bg-[color:var(--editorial-ink)] px-8 text-xs font-black uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-ink)]/92"
						disabled={submitDisabled}
					>
						{pending || submitting ? t("actions.submitting") : t("actions.createAccount")}
					</Button>
				)}
			</div>
		</form>
	);
}
