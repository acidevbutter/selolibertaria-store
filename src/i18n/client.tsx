"use client";

import { createContext, type ReactNode, use } from "react";
import { invariant } from "@/lib/utils";
import type { AppLocale } from "./config";
import { getMessagesInternal } from "./translate";
import type { IntlNamespaceKeys } from "./types";

type IntlClientProviderValue = { messages: IntlMessages; locale: AppLocale };
const IntlClientContext = createContext<IntlClientProviderValue | null>(null);

export const IntlClientProvider = ({
	messages,
	locale,
	children,
}: {
	messages: IntlMessages;
	locale: AppLocale;
	children: ReactNode;
}) => {
	return <IntlClientContext value={{ locale, messages }}>{children}</IntlClientContext>;
};

export const useTranslations = <TNamespaceKey extends IntlNamespaceKeys = never>(
	namespaceKey: TNamespaceKey,
) => {
	const ctx = use(IntlClientContext);
	invariant(ctx, "useTranslations must be used within a IntlClientProvider");
	return getMessagesInternal(namespaceKey, ctx.locale, ctx.messages);
};

export const useLocale = () => {
	const ctx = use(IntlClientContext);
	invariant(ctx, "useLocale must be used within a IntlClientProvider");
	return ctx.locale;
};
