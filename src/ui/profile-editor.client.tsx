"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/i18n/client";
import type { SupportedCurrency } from "@/lib/currency";
import { normalizePhoneParts } from "@/lib/location/countries";
import { AddressFields, type AddressValue } from "@/ui/auth/address-fields.client";
import { CurrencySelect } from "@/ui/auth/currency-select";
import { PhoneInput, type PhoneValue } from "@/ui/auth/phone-input.client";
import { Input } from "@/ui/shadcn/input";

// (Textarea removed - not used)

interface UserProfileData {
	_id: string;
	name?: string;
	email: string;
	phone?: string;
	preferredCurrency?: SupportedCurrency;
	phoneDetails?: {
		country?: string;
		dialCode?: string;
		national?: string;
		display?: string;
	};
	address?: {
		line1?: string;
		line2?: string;
		number?: string;
		complement?: string;
		district?: string;
		city?: string;
		state?: string;
		postalCode?: string;
		country?: string;
	};
	marketing?: {
		email?: {
			optIn?: boolean;
		};
	};
}

interface Props {
	defaultCountry: string;
	defaultCurrency: SupportedCurrency;
	userId: string;
	initial: UserProfileData;
	onSessionEmailChange?: (newEmail: string) => void;
}
type Status = { type: "idle" } | { type: "saving" } | { type: "saved" } | { type: "error"; message: string };

function buildAddressValue(initial: UserProfileData, defaultCountry: string): AddressValue {
	return {
		line1: initial.address?.line1 || "",
		line2: initial.address?.line2 || initial.address?.complement || "",
		number: initial.address?.number || "",
		complement: initial.address?.complement || initial.address?.line2 || "",
		district: initial.address?.district || "",
		city: initial.address?.city || "",
		state: initial.address?.state || "",
		postalCode: initial.address?.postalCode || "",
		country: initial.address?.country || defaultCountry,
	};
}

function buildPhoneValue(initial: UserProfileData, defaultCountry: string): PhoneValue {
	if (initial.phoneDetails?.country && initial.phoneDetails?.national) {
		return normalizePhoneParts(initial.phoneDetails.country, initial.phoneDetails.national);
	}
	const fallbackCountry = initial.address?.country || defaultCountry;
	return {
		...normalizePhoneParts(fallbackCountry, ""),
		e164: initial.phone || "",
		display: initial.phone || "",
		national: initial.phone || "",
	};
}

export function ProfileEditor({
	defaultCountry,
	defaultCurrency,
	userId,
	initial,
	onSessionEmailChange,
}: Props) {
	const t = useTranslations("Profile");
	const [form, setForm] = useState<UserProfileData>(initial);
	const [address, setAddress] = useState<AddressValue>(buildAddressValue(initial, defaultCountry));
	const [phone, setPhone] = useState<PhoneValue>(buildPhoneValue(initial, defaultCountry));
	const [status, setStatus] = useState<Status>({ type: "idle" });
	const [dirty, setDirty] = useState(false);
	const [verified, setVerified] = useState<boolean | null>(null);
	const [resendState, setResendState] = useState<{ sending?: boolean; message?: string | null }>({});

	const updateField = useCallback(<K extends keyof UserProfileData>(key: K, value: UserProfileData[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setDirty(true);
	}, []);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!dirty) return;
		if (verified === false) {
			setStatus({
				type: "error",
				message: t("errors.emailNotVerified"),
			});
			return;
		}
		setStatus({ type: "saving" });
		try {
			const payload: Record<string, unknown> = {
				name: form.name,
				email: form.email,
				preferredCurrency: form.preferredCurrency ?? defaultCurrency,
				phone: phone.e164 || undefined,
				phoneDetails: phone.e164
					? {
							country: phone.country,
							dialCode: phone.dialCode,
							national: phone.national,
							display: phone.display,
						}
					: undefined,
				address,
				marketing: {
					email: {
						optIn: Boolean(form.marketing?.email?.optIn),
					},
				},
			};
			// remove empty fields
			Object.keys(payload).forEach((k) => {
				// @ts-ignore
				if (payload[k] == null || payload[k] === "") delete payload[k];
			});
			const res = await fetch(`/api/users/${userId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				if (res.status === 403) {
					throw new Error(t("errors.emailNotVerified"));
				}
				if (res.status === 409) {
					throw new Error(t("errors.emailTaken"));
				}
				throw new Error(t("errors.failed"));
			}
			const saved = (await res.json()) as UserProfileData;
			// if email updated, verification resets client-side knowledge
			if (saved.email !== initial.email) setVerified(false);
			setForm(saved);
			setAddress(buildAddressValue(saved, defaultCountry));
			setPhone(buildPhoneValue(saved, defaultCountry));
			setStatus({ type: "saved" });
			setDirty(false);
			if (saved.email !== initial.email && onSessionEmailChange) {
				onSessionEmailChange(saved.email);
			}
			// reset saved indicator
			setTimeout(() => setStatus({ type: "idle" }), 2500);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : t("errors.unknown");
			setStatus({ type: "error", message });
		}
	}

	// automatic feedback for error/success states
	let banner: React.ReactNode = null;
	if (status.type === "saving")
		banner = <p className="text-xs text-muted-foreground">{t("status.saving")}</p>;
	if (status.type === "saved") banner = <p className="text-xs text-green-600">{t("status.saved")}</p>;
	if (status.type === "error") banner = <p className="text-xs text-destructive">{status.message}</p>;

	async function handleResend() {
		if (resendState.sending) return;
		setResendState({ sending: true, message: null });
		try {
			const res = await fetch("/api/auth/resend-verification", { method: "POST" });
			type ResendPayload = { ok?: boolean } | Record<string, unknown>;
			const payload = (await res.json().catch(() => ({}))) as ResendPayload;
			if (!res.ok) {
				setResendState({ sending: false, message: t("verification.resendFailed") });
				return;
			}
			if (payload?.ok === false) {
				setResendState({ sending: false, message: t("verification.resendFailed") });
				return;
			}
			setResendState({ sending: false, message: t("verification.resent") });
		} catch (err: unknown) {
			setResendState({ sending: false, message: t("verification.resendFailed") });
		}
	}

	// fetch verification state on mount
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const res = await fetch(`/api/users/${userId}`, { cache: "no-store" });
				if (!res.ok) return;
				const data = (await res.json()) as { verified?: boolean | undefined };
				if (mounted) setVerified(Boolean(data.verified));
			} catch {}
		})();
		return () => {
			mounted = false;
		};
	}, [userId]);

	return (
		<form onSubmit={handleSubmit} className="space-y-6" noValidate>
			{verified === false && (
				<div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 space-y-2">
					<p className="text-sm text-yellow-800">{t("verification.pending")}</p>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm" onClick={handleResend} disabled={resendState.sending}>
							{resendState.sending ? t("verification.sending") : t("verification.resend")}
						</Button>
						{resendState.message && <p className="text-sm">{resendState.message}</p>}
					</div>
				</div>
			)}
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="name">{t("fields.name")}</Label>
					<Input id="name" value={form.name || ""} onChange={(e) => updateField("name", e.target.value)} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="email">{t("fields.email")}</Label>
					<Input
						id="email"
						type="email"
						value={form.email}
						onChange={(e) => updateField("email", e.target.value)}
						required
					/>
				</div>
				<div className="space-y-2 md:col-span-2">
					<Label htmlFor="profile-preferred-currency">{t("fields.preferredCurrency")}</Label>
					<CurrencySelect
						id="profile-preferred-currency"
						value={form.preferredCurrency ?? defaultCurrency}
						onChange={(value) => updateField("preferredCurrency", value)}
					/>
					<p className="text-xs text-muted-foreground">{t("fields.preferredCurrencyHint")}</p>
				</div>
			</div>
			<PhoneInput
				idPrefix="profile-phone"
				label={t("fields.phone")}
				value={phone}
				onChange={(nextPhone) => {
					setPhone(nextPhone);
					setDirty(true);
				}}
			/>
			<AddressFields
				idPrefix="profile-address"
				value={address}
				onChange={(nextAddress) => {
					setAddress(nextAddress);
					setDirty(true);
				}}
				countryMode="br-only"
			/>
			<label className="flex items-start gap-3 rounded-lg border bg-card/60 p-4 text-sm">
				<input
					type="checkbox"
					checked={Boolean(form.marketing?.email?.optIn)}
					onChange={(event) => {
						setForm((prev) => ({
							...prev,
							marketing: {
								email: {
									optIn: event.currentTarget.checked,
								},
							},
						}));
						setDirty(true);
					}}
					className="mt-1 h-4 w-4 rounded border-gray-300"
				/>
				<span>
					<span className="block font-medium">{t("marketing.title")}</span>
					<span className="mt-1 block text-xs leading-5 text-muted-foreground">
						{t("marketing.description")}
					</span>
				</span>
			</label>
			<div className="flex items-center gap-4">
				<Button type="submit" disabled={status.type === "saving" || !dirty}>
					{status.type === "saving" ? t("actions.saving") : dirty ? t("actions.save") : t("actions.saved")}
				</Button>
				{banner}
			</div>
		</form>
	);
}
