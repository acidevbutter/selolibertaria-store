import { IntlMessageFormat } from "intl-messageformat";
import type { IntlNamespaceKeys, NamespacedKeys } from "./types";

export const getMessagesInternal = <TNamespaceKey extends IntlNamespaceKeys = never>(
	namespaceKey: TNamespaceKey,
	locale: string,
	messages: IntlMessages,
) => {
	return <TMessageKey extends NamespacedKeys<IntlMessages, TNamespaceKey> = never>(
		key: TMessageKey,
		values?: Record<string, string | number | undefined>,
	) => {
		const completeKey = namespaceKey + "." + key;
		const msg = messages[completeKey as keyof typeof messages];
		if (typeof msg !== "string") {
			return String(key);
		}
		const message = new IntlMessageFormat(msg, locale).format(values)?.toString() ?? "";
		return message;
	};
};
