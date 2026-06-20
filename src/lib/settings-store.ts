import "server-only";

import { cache } from "react";
import { type AppLocale, DEFAULT_LOCALE, getDefaultCountryForLocale, matchLocale } from "@/i18n/config";
import { getCountryOption } from "@/lib/location/countries";
import { getDb } from "@/lib/mongodb";
import type { SettingsDoc } from "@/lib/settings";

const SETTINGS_READ_TIMEOUT_MS = 1800;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			promise,
			new Promise<T>((_, reject) => {
				timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
			}),
		]);
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
}

export const getSettingsDoc = cache(async (): Promise<SettingsDoc | null> => {
	try {
		const db = await withTimeout(getDb(), SETTINGS_READ_TIMEOUT_MS, "Mongo settings connection");
		return await withTimeout(
			db.collection<SettingsDoc>("settings").findOne({}),
			SETTINGS_READ_TIMEOUT_MS,
			"Mongo settings read",
		);
	} catch (error) {
		console.warn("[settings-store] Falling back to defaults:", error);
		return null;
	}
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

export const getSupportEmailSetting = cache(async (): Promise<string | null> => {
	try {
		const settings = await getSettingsDoc();
		return settings?.current?.supportEmail?.trim() || null;
	} catch {
		return null;
	}
});
