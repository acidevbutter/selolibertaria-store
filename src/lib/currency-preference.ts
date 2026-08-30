import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { env } from "@/env.mjs";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
import {
	CURRENCY_COOKIE_NAME,
	getDefaultCurrencyForLocale,
	resolveSupportedCurrency,
	type SupportedCurrency,
} from "./currency";

export const getUserPreferredCurrencyById = cache(
	async (userId: string): Promise<SupportedCurrency | null> => {
		const token = (await cookies()).get("session")?.value;
		if (!token) return null;
		const response = await fetch(`${env.FASTAPI_API_URL}/auth/me`, {
			headers: { authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!response.ok) return null;
		const user = (await response.json()) as { id: string; preferred_currency?: string | null };
		if (user.id !== userId) return null;
		return resolveSupportedCurrency(user.preferred_currency) ?? null;
	},
);

export const getRequestPreferredCurrency = cache(async (): Promise<SupportedCurrency> => {
	const session = await auth();
	if (session?.user?.id) {
		const userCurrency = await getUserPreferredCurrencyById(session.user.id);
		if (userCurrency) return userCurrency;
	}

	const cookieStore = await cookies();
	const cookieCurrency = resolveSupportedCurrency(cookieStore.get(CURRENCY_COOKIE_NAME)?.value);
	if (cookieCurrency) return cookieCurrency;

	const adminLocale = await getDefaultLocaleSetting();
	if (adminLocale) return getDefaultCurrencyForLocale(adminLocale);

	return getDefaultCurrencyForLocale(DEFAULT_LOCALE);
});
