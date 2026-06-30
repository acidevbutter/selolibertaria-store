import { serializeSettingsForAdmin as serializeOAuthSettingsForAdmin } from "@/lib/oauth/config";
import type { SettingsDoc } from "@/lib/settings";
import { serializeMelhorEnvioSettingsForAdmin } from "@/lib/shipping";

export function serializeSettingsForAdmin(doc: SettingsDoc | null): SettingsDoc {
	const oauthSerialized = serializeOAuthSettingsForAdmin(doc);
	return {
		...oauthSerialized,
		current: {
			...oauthSerialized.current,
			shippingMelhorEnvio: serializeMelhorEnvioSettingsForAdmin(
				doc?.current?.shippingMelhorEnvio,
				doc?.current?.shippingProviders,
			),
		},
	};
}
