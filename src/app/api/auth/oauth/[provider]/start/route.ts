import { NextResponse } from "next/server";
import { OAUTH_PROVIDER_IDS, type OAuthProviderId } from "@/lib/oauth/catalog";
import { getResolvedOAuthProviderConfig } from "@/lib/oauth/config";
import { buildAuthorizationUrl, createOAuthState, createPkcePair } from "@/lib/oauth/provider-client";
import { setOAuthStateCookie } from "@/lib/oauth/state";

type RouteParams = { provider?: string | string[] };
type RouteContext = { params: Promise<RouteParams> };

function getProviderId(value: string | string[] | undefined): OAuthProviderId | null {
	const candidate = Array.isArray(value) ? value[0] : value;
	if (!candidate || !OAUTH_PROVIDER_IDS.includes(candidate as OAuthProviderId)) return null;
	return candidate as OAuthProviderId;
}

export async function GET(req: Request, context: RouteContext) {
	const providerId = getProviderId((await context.params).provider);
	if (!providerId) return NextResponse.redirect(new URL("/login?oauth_error=provider", req.url));
	const config = await getResolvedOAuthProviderConfig(providerId);
	if (!config.enabled || !config.ready || !config.clientId || !config.clientSecret) {
		return NextResponse.redirect(new URL("/login?oauth_error=disabled", req.url));
	}

	const state = createOAuthState();
	const pkce = providerId === "google" ? createPkcePair() : undefined;
	await setOAuthStateCookie({
		kind: "state",
		provider: providerId,
		state,
		codeVerifier: pkce?.verifier,
	});

	const url = buildAuthorizationUrl(providerId, {
		state,
		codeChallenge: pkce?.challenge,
	});
	url.searchParams.set("client_id", config.clientId);
	return NextResponse.redirect(url);
}
