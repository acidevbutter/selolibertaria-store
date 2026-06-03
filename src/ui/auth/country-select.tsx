"use client";

import { useLocale, useTranslations } from "@/i18n/client";
import { COUNTRY_OPTIONS, getCountryDisplayName, getCountryFlag } from "@/lib/location/countries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

type Props = {
	id: string;
	value: string;
	onChange: (value: string) => void;
};

export function CountrySelect({ id, value, onChange }: Props) {
	const locale = useLocale();
	const t = useTranslations("Address");

	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger id={id}>
				<SelectValue placeholder={t("selectCountry")} />
			</SelectTrigger>
			<SelectContent>
				{COUNTRY_OPTIONS.map((country) => (
					<SelectItem key={country.code} value={country.code}>
						{getCountryFlag(country.code)} {getCountryDisplayName(country.code, locale)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
