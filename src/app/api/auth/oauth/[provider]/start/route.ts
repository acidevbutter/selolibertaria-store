import { NextResponse } from "next/server";
import { env } from "@/env.mjs";
import { OAUTH_PROVIDER_IDS, type OAuthProviderId } from "@/lib/oauth/catalog";

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
	return NextResponse.redirect(new URL(`/auth/oauth/${providerId}/start`, env.FASTAPI_API_URL));
}
