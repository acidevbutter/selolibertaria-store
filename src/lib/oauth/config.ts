import "server-only";

import {
	OAUTH_PROVIDER_DEFINITIONS,
	OAUTH_PROVIDER_IDS,
	type OAuthProviderDefinition,
	type OAuthProviderId,
} from "@/lib/oauth/catalog";
import type { OAuthProviderSettings, SettingsDoc } from "@/lib/settings";
import { getSettingsDoc } from "@/lib/settings-store";

export type ResolvedOAuthProviderConfig = OAuthProviderDefinition & {
	enabled: boolean;
	ready: boolean;
	clientId: string | null;
	clientSecret: string | null;
	clientSecretMasked: string | null;
};

function normalizeProviderSettings(
	value: OAuthProviderSettings | undefined,
): Required<Pick<OAuthProviderSettings, "enabled">> & OAuthProviderSettings {
	const clientId = value?.clientId?.trim() ?? "";
	return {
		enabled: value?.enabled === true,
		clientId,
		clientIdMasked: value?.clientIdMasked ?? null,
		clientSecretMasked: value?.clientSecretMasked ?? null,
		lastUpdatedAt: value?.lastUpdatedAt ?? null,
		lastUpdatedBy: value?.lastUpdatedBy ?? null,
	};
}

export async function getResolvedOAuthProviderConfig(
	providerId: OAuthProviderId,
): Promise<ResolvedOAuthProviderConfig> {
	const settings = await getSettingsDoc();
	const raw = settings?.current?.oauthProviders?.[providerId];
	const normalized = normalizeProviderSettings(raw);
	const clientSecret = normalized.clientSecretMasked ? "configured" : null;
	return {
		...OAUTH_PROVIDER_DEFINITIONS[providerId],
		enabled: normalized.enabled,
		ready: normalized.enabled && Boolean(normalized.clientId) && Boolean(clientSecret),
		clientId: normalized.clientId || null,
		clientSecret,
		clientSecretMasked: normalized.clientSecretMasked ?? null,
	};
}

export async function getPublicOAuthProviders() {
	const resolved = await Promise.all(
		OAUTH_PROVIDER_IDS.map((providerId) => getResolvedOAuthProviderConfig(providerId)),
	);
	return resolved
		.filter((provider) => provider.enabled && provider.ready)
		.map((provider) => ({
			id: provider.id,
			label: provider.label,
			href: `/api/auth/oauth/${provider.id}/start`,
		}));
}

export function serializeSettingsForAdmin(doc: SettingsDoc | null): SettingsDoc {
	const current = doc?.current ?? {};
	const oauthProviders = Object.fromEntries(
		OAUTH_PROVIDER_IDS.map((providerId) => {
			const raw = current.oauthProviders?.[providerId];
			const normalized = normalizeProviderSettings(raw);
			return [
				providerId,
				{
					enabled: normalized.enabled,
					clientId: normalized.clientId || "",
					clientIdMasked: normalized.clientIdMasked ?? null,
					clientSecretMasked: normalized.clientSecretMasked ?? null,
					lastUpdatedAt: normalized.lastUpdatedAt ?? null,
					lastUpdatedBy: normalized.lastUpdatedBy ?? null,
				},
			];
		}),
	);
	return {
		_id: doc?._id,
		current: {
			...current,
			oauthProviders,
		},
		history: doc?.history ?? [],
	};
}
