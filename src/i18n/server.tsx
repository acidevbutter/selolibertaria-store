import { cache } from "react";
import { type AppLocale, DEFAULT_LOCALE } from "./config";
import { getMessagesInternal } from "./translate";
import type { IntlNamespaceKeys } from "./types";

type MessagesShape = typeof import("../../messages/pt-BR.json");
type MessageModule = Promise<{ default: MessagesShape }>;

const createMessageLoader = (loader: () => Promise<{ default: unknown }>) => loader as () => MessageModule;

const MESSAGE_LOADERS = {
	"pt-BR": createMessageLoader(() => import("../../messages/pt-BR.json")),
} satisfies Record<AppLocale, () => MessageModule>;

const getMessagesByLocale = cache(async (_locale: AppLocale) => {
	const { default: localizedMessages } = await MESSAGE_LOADERS[DEFAULT_LOCALE]();
	return localizedMessages;
});

const getRequestLocale = cache(async (): Promise<AppLocale> => DEFAULT_LOCALE);

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
