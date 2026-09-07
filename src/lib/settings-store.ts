import "server-only";

import { cache } from "react";
import { env } from "@/env.mjs";
import { type AppLocale, DEFAULT_LOCALE, getDefaultCountryForLocale, matchLocale } from "@/i18n/config";
import { getCountryOption } from "@/lib/location/countries";
import type { PreSaleModeSettings, SettingsDoc } from "@/lib/settings";

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
		const response = await withTimeout(
			fetch(`${env.FASTAPI_API_URL}/settings/public`, { cache: "no-store" }),
			SETTINGS_READ_TIMEOUT_MS,
			"FastAPI settings read",
		);
		if (!response.ok) return null;
		const payload = (await response.json()) as {
			current?: SettingsDoc["current"];
			history?: SettingsDoc["history"];
		};
		return { current: payload.current ?? {}, history: payload.history ?? [] } as SettingsDoc;
	} catch (error) {
		console.warn("[settings-store] FastAPI unavailable; falling back to defaults:", error);
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

/** Boleto is opt-in via admin and off by default. */
export const getPaymentBoletoEnabledSetting = cache(async (): Promise<boolean> => {
	try {
		const settings = await getSettingsDoc();
		return settings?.current?.paymentBoletoEnabled === true;
	} catch {
		return false;
	}
});

/** Pré-venda é uma decisão editorial persistida; ausente significa desligada. */
export const getPreSaleModeSettings = cache(async (): Promise<PreSaleModeSettings> => {
	try {
		const settings = await getSettingsDoc();
		return settings?.current?.preSale ?? {};
	} catch {
		return {};
	}
});

/** @deprecated Use `getPreSaleModeSettings` + `resolvePreSaleAvailability`. */
export const getPreSaleModeSetting = cache(async (): Promise<boolean> => {
	const { pageEnabled, enabled } = await getPreSaleModeSettings();
	return pageEnabled ?? enabled ?? false;
});
