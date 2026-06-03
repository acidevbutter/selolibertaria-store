"use client";

import { Label } from "@/components/ui/label";
import { useTranslations } from "@/i18n/client";
import {
	COUNTRY_OPTIONS,
	formatNationalPhone,
	getCountryFlag,
	getCountryOption,
	normalizePhoneParts,
} from "@/lib/location/countries";
import { Input } from "@/ui/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

export type PhoneValue = {
	country: string;
	national: string;
	dialCode: string;
	e164: string;
	display: string;
};

type Props = {
	idPrefix: string;
	label: string;
	value: PhoneValue;
	onChange: (value: PhoneValue) => void;
	required?: boolean;
};

export function PhoneInput({ idPrefix, label, value, onChange, required }: Props) {
	const country = getCountryOption(value.country);
	const renderedValue = formatNationalPhone(value.country, value.national);
	const t = useTranslations("Address");

	return (
		<div className="grid gap-2">
			<Label htmlFor={`${idPrefix}-national`}>{label}</Label>
			<div className="flex min-w-0 items-stretch">
				<Select
					value={country.code}
					onValueChange={(nextCountry) => onChange(normalizePhoneParts(nextCountry, value.national))}
				>
					<SelectTrigger
						id={`${idPrefix}-country`}
						className="h-9 w-auto min-w-[110px] shrink-0 rounded-r-none border-r-0 bg-muted/40 px-3"
					>
						<SelectValue placeholder={t("country")} />
					</SelectTrigger>
					<SelectContent>
						{COUNTRY_OPTIONS.map((option) => (
							<SelectItem key={option.code} value={option.code}>
								{getCountryFlag(option.code)} {option.dialCode}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Input
					id={`${idPrefix}-national`}
					value={renderedValue}
					onChange={(event) => onChange(normalizePhoneParts(value.country, event.target.value))}
					autoComplete="tel"
					inputMode="tel"
					className="min-w-0 rounded-l-none"
					placeholder={country.code === "BR" ? "(11) 91234-5678" : "555 123 4567"}
					required={required}
				/>
			</div>
		</div>
	);
}
