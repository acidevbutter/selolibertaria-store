import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import { env } from "@/env.mjs";
import {
	LOCALE_COOKIE_NAME,
	matchLocale,
	resolveLocale,
	resolveLocaleFromAcceptLanguage,
} from "@/i18n/config";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
import {
	CURRENCY_COOKIE_NAME,
	getDefaultCurrencyForLocale,
	resolveSupportedCurrency,
	type SupportedCurrency,
} from "./currency";

export const getUserPreferredCurrencyById = cache(
	async (userId: string): Promise<SupportedCurrency | null> => {
		const { ObjectId } = await import("mongodb");
		const db = await getDb();
		const user = await db
			.collection("users")
			.findOne<{ preferredCurrency?: string | null }>(
				{ _id: new ObjectId(userId) },
				{ projection: { preferredCurrency: 1 } },
			);
		return resolveSupportedCurrency(user?.preferredCurrency) ?? null;
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

	const cookieLocale = matchLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
	if (cookieLocale) return getDefaultCurrencyForLocale(cookieLocale);

	const headerStore = await headers();
	const headerLocale = resolveLocaleFromAcceptLanguage(headerStore.get("accept-language"));
	if (headerLocale) return getDefaultCurrencyForLocale(headerLocale);

	const adminLocale = await getDefaultLocaleSetting();
	if (adminLocale) return getDefaultCurrencyForLocale(adminLocale);

	return getDefaultCurrencyForLocale(resolveLocale(env.NEXT_PUBLIC_LANGUAGE));
});
