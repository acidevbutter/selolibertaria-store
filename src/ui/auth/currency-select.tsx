"use client";

import { useLocale, useTranslations } from "@/i18n/client";
import { CURRENCY_OPTIONS, type SupportedCurrency } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

type Props = {
	id?: string;
	value: SupportedCurrency;
	onChange: (value: SupportedCurrency) => void;
	disabled?: boolean;
};

function getCurrencyDisplayName(code: SupportedCurrency, locale: string) {
	try {
		const displayNames = new Intl.DisplayNames([locale], { type: "currency" });
		return displayNames.of(code) ?? code;
	} catch {
		return code;
	}
}

export function CurrencySelect({ id, value, onChange, disabled }: Props) {
	const locale = useLocale();
	const t = useTranslations("Currency");

	return (
		<Select
			value={value}
			onValueChange={(nextValue) => onChange(nextValue as SupportedCurrency)}
			disabled={disabled}
		>
			<SelectTrigger id={id}>
				<SelectValue placeholder={t("select")} />
			</SelectTrigger>
			<SelectContent>
				{CURRENCY_OPTIONS.map((currency) => (
					<SelectItem key={currency.code} value={currency.code}>
						{currency.code} · {getCurrencyDisplayName(currency.code, locale)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
