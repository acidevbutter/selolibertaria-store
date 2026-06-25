import { cookies, headers } from "next/headers";
import { cache } from "react";
import { env } from "@/env.mjs";
import {
	type AppLocale,
	DEFAULT_LOCALE,
	LOCALE_COOKIE_NAME,
	resolveLocale,
	resolveLocaleFromAcceptLanguage,
	TEMP_FORCE_PT_BR,
} from "./config";
import { getMessagesInternal } from "./translate";
import type { IntlNamespaceKeys } from "./types";

type MessagesShape = typeof import("../../messages/en-US.json");
type MessageModule = Promise<{ default: MessagesShape }>;

const createMessageLoader = (loader: () => Promise<{ default: unknown }>) => loader as () => MessageModule;

const MESSAGE_LOADERS = {
	"en-US": createMessageLoader(() => import("../../messages/en-US.json")),
	"es-ES": createMessageLoader(() => import("../../messages/es-ES.json")),
	"pt-BR": createMessageLoader(() => import("../../messages/pt-BR.json")),
	"de-DE": createMessageLoader(() => import("../../messages/de-DE.json")),
	"fr-CA": createMessageLoader(() => import("../../messages/fr-CA.json")),
	"jp-JP": createMessageLoader(() => import("../../messages/jp-JP.json")),
	"zh-CN": createMessageLoader(() => import("../../messages/zh-CN.json")),
	"zh-TW": createMessageLoader(() => import("../../messages/zh-TW.json")),
} satisfies Record<AppLocale, () => MessageModule>;

const getMessagesByLocale = cache(async (locale: AppLocale) => {
	const { default: localizedMessages } = await MESSAGE_LOADERS[locale]();
	if (locale === DEFAULT_LOCALE) {
		return localizedMessages;
	}

	const { default: fallbackMessages } = await MESSAGE_LOADERS[DEFAULT_LOCALE]();
	return {
		...fallbackMessages,
		...localizedMessages,
	};
});

const getRequestLocale = cache(async (): Promise<AppLocale> => {
	if (TEMP_FORCE_PT_BR) {
		return DEFAULT_LOCALE;
	}

	const cookieStore = await cookies();
	const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value?.trim();
	if (cookieLocale) {
		return resolveLocale(cookieLocale);
	}

	const headerStore = await headers();
	const browserLocale = resolveLocaleFromAcceptLanguage(headerStore.get("accept-language"));
	if (browserLocale) {
		return browserLocale;
	}

	const envLocale = env.NEXT_PUBLIC_LANGUAGE?.trim();
	if (envLocale) {
		return resolveLocale(envLocale);
	}

	return DEFAULT_LOCALE;
});

export const getLocale = async (): Promise<AppLocale> => getRequestLocale();

export const getMessages = async () => {
	const locale = await getLocale();
	return getMessagesByLocale(locale);
};

export const getTranslations = async <TNamespaceKey extends IntlNamespaceKeys = never>(
	namespaceKey: TNamespaceKey,
) => {
	const locale = await getLocale();
	const messages = await getMessagesByLocale(locale);
	return getMessagesInternal(namespaceKey, locale, messages);
};
