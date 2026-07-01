"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { useLocale, useTranslations } from "@/i18n/client";
import { getPostalCodeLabel, normalizePostalCode } from "@/lib/location/countries";
import { CountrySelect } from "@/ui/auth/country-select";
import { Input } from "@/ui/shadcn/input";

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

	return (
		<div className="grid gap-4">
			<div className="grid gap-4 md:grid-cols-2">
				{isBrazilOnly ? (
					<div className="md:col-span-2">
						<p className="text-xs text-muted-foreground">No momento, atendemos apenas endereços no Brasil.</p>
					</div>
				) : (
					<div className="grid gap-2">
						<Label htmlFor={`${idPrefix}-country`}>{t("country")}</Label>
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

				<div className="grid gap-2">
					<Label htmlFor={`${idPrefix}-postal-code`}>{postalLabel}</Label>
					<Input
						id={`${idPrefix}-postal-code`}
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
			</div>

			{lookupStatus ? <p className="-mt-2 text-xs text-muted-foreground">{lookupStatus}</p> : null}

			<div className="grid gap-2">
				<Label htmlFor={`${idPrefix}-line1`}>{t("fields.streetAddress")}</Label>
				<Input
					id={`${idPrefix}-line1`}
					value={current.line1}
					onChange={(event) => setField("line1", event.target.value)}
					autoComplete="address-line1"
					placeholder={t("placeholders.streetAddress")}
					disabled={postalFieldsLocked && effectiveCountry === "BR"}
					title={postalFieldsLocked && effectiveCountry === "BR" ? t("fieldAutoFilled") : undefined}
					required={required}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px]">
				<div className="grid gap-2">
					<Label htmlFor={`${idPrefix}-district`}>{t("fields.district")}</Label>
					<Input
						id={`${idPrefix}-district`}
						value={current.district}
						onChange={(event) => setField("district", event.target.value)}
						placeholder={t("placeholders.district")}
						disabled={postalFieldsLocked && effectiveCountry === "BR"}
						title={postalFieldsLocked && effectiveCountry === "BR" ? t("fieldAutoFilled") : undefined}
						required={required && effectiveCountry === "BR"}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor={`${idPrefix}-city`}>{t("fields.city")}</Label>
					<Input
						id={`${idPrefix}-city`}
						value={current.city}
						onChange={(event) => setField("city", event.target.value)}
						autoComplete="address-level2"
						disabled={postalFieldsLocked && effectiveCountry === "BR"}
						title={postalFieldsLocked && effectiveCountry === "BR" ? t("fieldAutoFilled") : undefined}
						required={required}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor={`${idPrefix}-state`}>{t("fields.state")}</Label>
					<Input
						id={`${idPrefix}-state`}
						value={current.state}
						onChange={(event) => setField("state", event.target.value)}
						autoComplete="address-level1"
						maxLength={effectiveCountry === "BR" ? 2 : undefined}
						disabled={postalFieldsLocked && effectiveCountry === "BR"}
						title={postalFieldsLocked && effectiveCountry === "BR" ? t("fieldAutoFilled") : undefined}
						required={required}
					/>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
				<div className="grid gap-2">
					<Label htmlFor={`${idPrefix}-number`}>{t("fields.number")}</Label>
					<Input
						id={`${idPrefix}-number`}
						value={current.number}
						onChange={(event) => setField("number", event.target.value)}
						autoComplete="address-line2"
						placeholder={t("placeholders.number")}
						required={required}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor={`${idPrefix}-complement`}>{t("fields.complement")}</Label>
					<Input
						id={`${idPrefix}-complement`}
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
		</div>
	);
}

async function resolvePostalLookup(country: string, postalCode: string): Promise<PostalLookupOutcome> {
	const internalLookup = await lookupPostalCodeFromApi(country, postalCode);
	if (internalLookup.status === "success" || internalLookup.status === "not-found") {
		return internalLookup;
	}

	if (country === "BR") {
		return lookupBrazilianPostalCodeDirect(postalCode);
	}

	return { status: "unavailable" };
}

async function lookupPostalCodeFromApi(country: string, postalCode: string): Promise<PostalLookupOutcome> {
	try {
		const res = await fetch(
			`/api/address/postal-lookup?country=${encodeURIComponent(country)}&postalCode=${encodeURIComponent(postalCode)}`,
			{ cache: "no-store" },
		);
		const data = (await res.json().catch(() => ({}))) as { error?: string; result?: PostalLookupResult };
		if (res.ok && data.result) {
			return { status: "success", result: data.result };
		}
		if (res.status === 404) {
			return { status: "not-found" };
		}
		return { status: "unavailable" };
	} catch {
		return { status: "unavailable" };
	}
}

async function lookupBrazilianPostalCodeDirect(postalCode: string): Promise<PostalLookupOutcome> {
	const digits = postalCode.replace(/\D+/g, "");
	let sawUnavailableProvider = false;

	for (const provider of [lookupBrazilianPostalCodeFromViaCep, lookupBrazilianPostalCodeFromBrasilApi]) {
		const result = await provider(digits);
		if (result.status === "success") return result;
		if (result.status === "unavailable") sawUnavailableProvider = true;
	}

	return sawUnavailableProvider ? { status: "unavailable" } : { status: "not-found" };
}

async function lookupBrazilianPostalCodeFromViaCep(digits: string): Promise<PostalLookupOutcome> {
	try {
		const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { cache: "no-store" });
		if (!res.ok) return res.status === 404 ? { status: "not-found" } : { status: "unavailable" };

		const data = (await res.json()) as {
			erro?: boolean;
			logradouro?: string;
			bairro?: string;
			localidade?: string;
			uf?: string;
			cep?: string;
		};

		if (data.erro) return { status: "not-found" };

		return {
			status: "success",
			result: {
				line1: data.logradouro || "",
				line2: "",
				district: data.bairro || "",
				city: data.localidade || "",
				state: data.uf || "",
				postalCode: data.cep || normalizePostalCode("BR", digits),
				country: "BR",
			},
		};
	} catch {
		return { status: "unavailable" };
	}
}

async function lookupBrazilianPostalCodeFromBrasilApi(digits: string): Promise<PostalLookupOutcome> {
	try {
		const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, { cache: "no-store" });
		if (!res.ok) return res.status === 404 ? { status: "not-found" } : { status: "unavailable" };

		const data = (await res.json()) as {
			cep?: string;
			state?: string;
			city?: string;
			neighborhood?: string;
			street?: string;
		};

		return {
			status: "success",
			result: {
				line1: data.street || "",
				line2: "",
				district: data.neighborhood || "",
				city: data.city || "",
				state: data.state || "",
				postalCode: data.cep || normalizePostalCode("BR", digits),
				country: "BR",
			},
		};
	} catch {
		return { status: "unavailable" };
	}
}
