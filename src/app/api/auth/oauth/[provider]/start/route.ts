import { NextResponse } from "next/server";
import { env, publicUrl } from "@/env.mjs";
import { OAUTH_PROVIDER_IDS, type OAuthProviderId } from "@/lib/oauth/catalog";

type RouteParams = { provider?: string | string[] };
type RouteContext = { params: Promise<RouteParams> };

function getProviderId(value: string | string[] | undefined): OAuthProviderId | null {
	const candidate = Array.isArray(value) ? value[0] : value;
	if (!candidate || !OAUTH_PROVIDER_IDS.includes(candidate as OAuthProviderId)) return null;
	return candidate as OAuthProviderId;
}

export async function GET(_req: Request, context: RouteContext) {
	const providerId = getProviderId((await context.params).provider);
	if (!providerId) return NextResponse.redirect(new URL("/login?oauth_error=provider", publicUrl));

	// FastAPI's GET /auth/oauth/{provider}/start returns {authorization_url}
	// as JSON, not an HTTP redirect -- this BFF route is what turns that into
	// the browser redirect to the provider's consent page.
	const response = await fetch(new URL(`/auth/oauth/${providerId}/start`, env.FASTAPI_API_URL), {
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => ({}))) as { authorization_url?: string };
	if (!response.ok || !payload.authorization_url) {
		return NextResponse.redirect(new URL("/login?oauth_error=provider", publicUrl));
	}
	return NextResponse.redirect(payload.authorization_url);
}
