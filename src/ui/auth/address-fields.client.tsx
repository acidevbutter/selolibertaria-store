"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "@/i18n/client";
import { getPostalCodeLabel, normalizePostalCode } from "@/lib/location/countries";
import { CountrySelect } from "@/ui/auth/country-select";
import { SlField } from "@/ui/sl/sl-field";

export type AddressValue = {
	line1: string;
	line2: string;
	number: string;
	complement: string;
	district: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
};

type Props = {
	idPrefix: string;
	value: AddressValue;
	onChange: (value: AddressValue) => void;
	required?: boolean;
	countryMode?: "select" | "br-only";
	onResolvedAddress?: (value: AddressValue) => void;
};

type PostalLookupResult = {
	line1?: string;
	line2?: string;
	district?: string;
	city?: string;
	state?: string;
	postalCode?: string;
	country?: string;
};

type PostalLookupOutcome =
	| { status: "success"; result: PostalLookupResult }
	| { status: "not-found" }
	| { status: "unavailable" };

export function AddressFields({
	idPrefix,
	value,
	onChange,
	required,
	countryMode = "select",
	onResolvedAddress,
}: Props) {
	const locale = useLocale();
	const t = useTranslations("Address");
	const [lookupStatus, setLookupStatus] = useState<string | null>(null);
	const [postalFieldsLocked, setPostalFieldsLocked] = useState(false);
	const lastLookupKeyRef = useRef<string | null>(null);
	const isBrazilOnly = countryMode === "br-only";

	const current: AddressValue = {
		line1: value.line1 ?? "",
		line2: value.line2 ?? "",
		number: value.number ?? "",
		complement: value.complement ?? "",
		district: value.district ?? "",
		city: value.city ?? "",
		state: value.state ?? "",
		postalCode: value.postalCode ?? "",
		country: value.country || "BR",
	};

	const effectiveCountry = isBrazilOnly ? "BR" : current.country;
	const postalLabel = getPostalCodeLabel(effectiveCountry, locale);

	function withCountryConstraint(next: AddressValue): AddressValue {
		return isBrazilOnly ? { ...next, country: "BR" } : next;
	}

	function clearPostalDerivedAddress(postalCode = current.postalCode) {
		setPostalFieldsLocked(false);
		onChange(
			withCountryConstraint({
				...current,
				line1: "",
				district: "",
				city: "",
				state: "",
				postalCode,
			}),
		);
	}

	async function lookupPostalCode(postalCodeValue = current.postalCode, force = false) {
		const postalCode = postalCodeValue.trim();
		const postalDigits = postalCode.replace(/\D+/g, "");

		if (effectiveCountry !== "BR" || postalDigits.length !== 8) return;

		const lookupKey = `${effectiveCountry}:${postalDigits}`;
		if (!force && lastLookupKeyRef.current === lookupKey) return;
		lastLookupKeyRef.current = lookupKey;

		setLookupStatus(t("lookup.loading"));

		try {
			const lookup = await resolvePostalLookup(effectiveCountry, postalCode);
			if (lookup.status === "unavailable") {
				setLookupStatus(t("lookup.unavailable"));
				clearPostalDerivedAddress(normalizePostalCode(effectiveCountry, postalCode));
				return;
			}

			if (lookup.status === "not-found") {
				setLookupStatus(t("lookup.notFound"));
				clearPostalDerivedAddress(normalizePostalCode(effectiveCountry, postalCode));
				return;
			}

			const nextAddress = withCountryConstraint({
				...current,
				line1: lookup.result.line1 ?? "",
				district: lookup.result.district ?? lookup.result.line2 ?? "",
				city: lookup.result.city ?? "",
				state: lookup.result.state ?? "",
				postalCode: lookup.result.postalCode || normalizePostalCode(effectiveCountry, postalCode),
				country: lookup.result.country || effectiveCountry,
			});

			onChange(nextAddress);
			onResolvedAddress?.(nextAddress);
			setPostalFieldsLocked(effectiveCountry === "BR");
			setLookupStatus(t("lookup.success"));
		} catch {
			setPostalFieldsLocked(false);
			setLookupStatus(t("lookup.unavailable"));
			clearPostalDerivedAddress(normalizePostalCode(effectiveCountry, postalCode));
		}
	}

	useEffect(() => {
		const postalDigits = current.postalCode.replace(/\D+/g, "");
		if (effectiveCountry !== "BR" || postalDigits.length !== 8) return;

		const lookupDelay = window.setTimeout(() => {
			void lookupPostalCode(current.postalCode);
		}, 400);

		return () => window.clearTimeout(lookupDelay);
	}, [effectiveCountry, current.postalCode]);

	function setField<K extends keyof AddressValue>(key: K, next: AddressValue[K]) {
		onChange(withCountryConstraint({ ...current, [key]: next }));
	}

	function handlePostalCodeChange(rawValue: string) {
		const nextPostalCode = normalizePostalCode(effectiveCountry, rawValue);
		const postalDigits = nextPostalCode.replace(/\D+/g, "");

		lastLookupKeyRef.current = null;
		setPostalFieldsLocked(false);
		setLookupStatus(null);

		onChange(
			withCountryConstraint({
				...current,
				postalCode: nextPostalCode,
				...(effectiveCountry === "BR" && (postalDigits.length < 8 || nextPostalCode !== current.postalCode)
					? {
							line1: "",
							district: "",
							city: "",
							state: "",
						}
					: {}),
			}),
		);
	}

	const autoFilledHint =
		postalFieldsLocked && effectiveCountry === "BR" ? { title: t("fieldAutoFilled") } : {};

	return (
		<div className="grid gap-4">
			<div className="grid gap-4 md:grid-cols-2">
				{isBrazilOnly ? (
					<div className="md:col-span-2">
						<p className="m-0 text-[13px] text-[color:var(--sl-text-muted)]">
							No momento, atendemos apenas endereços no Brasil.
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						<label htmlFor={`${idPrefix}-country`} className="sl-lbl">
							{t("country")}
						</label>
						<CountrySelect
							id={`${idPrefix}-country`}
							value={current.country}
							onChange={(country) =>
								onChange({
									...current,
									country,
									postalCode: normalizePostalCode(country, current.postalCode),
								})
							}
						/>
					</div>
				)}

				<SlField
					id={`${idPrefix}-postal-code`}
					label={postalLabel}
					value={current.postalCode}
					onChange={(event) => handlePostalCodeChange(event.target.value)}
					onBlur={() => void lookupPostalCode(current.postalCode, true)}
					autoComplete="postal-code"
					placeholder={effectiveCountry === "BR" ? "00000-000" : postalLabel}
					inputMode={effectiveCountry === "BR" ? "numeric" : "text"}
					maxLength={effectiveCountry === "BR" ? 9 : undefined}
					required={required}
				/>
			</div>

			{lookupStatus ? (
				<p className="-mt-2 text-[13px] text-[color:var(--sl-text-soft)]">{lookupStatus}</p>
			) : null}

			<SlField
				id={`${idPrefix}-line1`}
				label={t("fields.streetAddress")}
				value={current.line1}
				onChange={(event) => setField("line1", event.target.value)}
				autoComplete="address-line1"
				placeholder={t("placeholders.streetAddress")}
				disabled={postalFieldsLocked && effectiveCountry === "BR"}
				{...autoFilledHint}
				required={required}
			/>

			<div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px]">
				<SlField
					id={`${idPrefix}-district`}
					label={t("fields.district")}
					value={current.district}
					onChange={(event) => setField("district", event.target.value)}
					placeholder={t("placeholders.district")}
					disabled={postalFieldsLocked && effectiveCountry === "BR"}
					{...autoFilledHint}
					required={required && effectiveCountry === "BR"}
				/>

				<SlField
					id={`${idPrefix}-city`}
					label={t("fields.city")}
					value={current.city}
					onChange={(event) => setField("city", event.target.value)}
					autoComplete="address-level2"
					disabled={postalFieldsLocked && effectiveCountry === "BR"}
					{...autoFilledHint}
					required={required}
				/>

				<SlField
					id={`${idPrefix}-state`}
					label={t("fields.state")}
					value={current.state}
					onChange={(event) => setField("state", event.target.value)}
					autoComplete="address-level1"
					maxLength={effectiveCountry === "BR" ? 2 : undefined}
					disabled={postalFieldsLocked && effectiveCountry === "BR"}
					{...autoFilledHint}
					required={required}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
				<SlField
					id={`${idPrefix}-number`}
					label={t("fields.number")}
					value={current.number}
					onChange={(event) => setField("number", event.target.value)}
					autoComplete="address-line2"
					placeholder={t("placeholders.number")}
					required={required}
				/>

				<SlField
					id={`${idPrefix}-complement`}
					label={t("fields.complement")}
					value={current.complement || current.line2}
					onChange={(event) =>
						onChange(
							withCountryConstraint({
								...current,
								complement: event.target.value,
								line2: event.target.value,
							}),
						)
					}
					autoComplete="address-line3"
					placeholder={t("placeholders.complement")}
				/>
			</div>
		</div>
	);
}

async function resolvePostalLookup(country: string, postalCode: string): Promise<PostalLookupOutcome> {
	const internalLookup = await lookupPostalCodeFromApi(country, postalCode);
	if (internalLookup.status === "success" || internalLookup.status === "not-found") {
		return internalLookup;
	}
	return { status: "unavailable" };
}

async function lookupPostalCodeFromApi(country: string, postalCode: string): Promise<PostalLookupOutcome> {
	try {
		const res = await fetch(
			`/api/address/postal-lookup?country=${encodeURIComponent(country)}&postalCode=${encodeURIComponent(postalCode)}`,
			{ cache: "no-store" },
		);
		const data = (await res.json().catch(() => ({}))) as PostalLookupResult;
		if (res.ok && data.postalCode) {
			return { status: "success", result: data };
		}
		if (res.status === 404) {
			return { status: "not-found" };
		}
		return { status: "unavailable" };
	} catch {
		return { status: "unavailable" };
	}
}
