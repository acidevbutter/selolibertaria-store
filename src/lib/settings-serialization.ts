import { serializeSettingsForAdmin as serializeOAuthSettingsForAdmin } from "@/lib/oauth/config";
import type { SettingsDoc } from "@/lib/settings";
import { serializeShippingProvidersForAdmin } from "@/lib/shipping";

export function serializeSettingsForAdmin(doc: SettingsDoc | null): SettingsDoc {
	const oauthSerialized = serializeOAuthSettingsForAdmin(doc);
	return {
		...oauthSerialized,
		current: {
			...oauthSerialized.current,
			shippingProviders: serializeShippingProvidersForAdmin(doc?.current?.shippingProviders),
		},
	};
}
