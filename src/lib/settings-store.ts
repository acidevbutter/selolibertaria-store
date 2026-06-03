import "server-only";

import { cache } from "react";
import { type AppLocale, DEFAULT_LOCALE, getDefaultCountryForLocale, matchLocale } from "@/i18n/config";
import { getCountryOption } from "@/lib/location/countries";
import { getDb } from "@/lib/mongodb";
import type { SettingsDoc } from "@/lib/settings";

export const getSettingsDoc = cache(async (): Promise<SettingsDoc | null> => {
	const db = await getDb();
	return await db.collection<SettingsDoc>("settings").findOne({});
});

export const getDefaultLocaleSetting = cache(async (): Promise<AppLocale | null> => {
	const settings = await getSettingsDoc();
	return matchLocale(settings?.current?.defaultLocale) ?? null;
});

export const getDefaultCountrySetting = cache(async (locale?: string) => {
	const settings = await getSettingsDoc();
	const configured = settings?.current?.defaultCountry;
	if (configured) return getCountryOption(configured).code;

	return getDefaultCountryForLocale(locale ?? settings?.current?.defaultLocale ?? DEFAULT_LOCALE);
});
