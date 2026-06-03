import { NextResponse } from "next/server";
import { findOrCreateOAuthUser } from "@/lib/auth/oauth-users";
import { mergeGuestCartIntoUserCart, resolvePostAuthRedirect } from "@/lib/auth/post-auth";
import { OAUTH_PROVIDER_IDS, type OAuthProviderId } from "@/lib/oauth/catalog";
import { getResolvedOAuthProviderConfig } from "@/lib/oauth/config";
import { exchangeCodeForProfile } from "@/lib/oauth/provider-client";
import {
	clearOAuthPendingCookie,
	clearOAuthStateCookie,
	readOAuthStateCookie,
	setOAuthPendingCookie,
} from "@/lib/oauth/state";
import { createPersistentSession } from "@/lib/session";

type RouteParams = { provider?: string | string[] };
type RouteContext = { params: Promise<RouteParams> };

function getProviderId(value: string | string[] | undefined): OAuthProviderId | null {
	const candidate = Array.isArray(value) ? value[0] : value;
	if (!candidate || !OAUTH_PROVIDER_IDS.includes(candidate as OAuthProviderId)) return null;
	return candidate as OAuthProviderId;
}

function buildLoginRedirect(req: Request, search: string) {
	return NextResponse.redirect(new URL(`/login${search}`, req.url));
}

export async function GET(req: Request, context: RouteContext) {
	const providerId = getProviderId((await context.params).provider);
	if (!providerId) return buildLoginRedirect(req, "?oauth_error=provider");

	const url = new URL(req.url);
	const state = url.searchParams.get("state") || "";
	const code = url.searchParams.get("code") || "";
	const stateCookie = await readOAuthStateCookie();
	await clearOAuthStateCookie();

	if (!stateCookie || stateCookie.provider !== providerId || stateCookie.state !== state) {
		return buildLoginRedirect(req, "?oauth_error=state");
	}

	const config = await getResolvedOAuthProviderConfig(providerId);
	if (!config.enabled || !config.ready || !config.clientId || !config.clientSecret) {
		return buildLoginRedirect(req, "?oauth_error=disabled");
	}
	if (!code) return buildLoginRedirect(req, "?oauth_error=code");

	try {
		const profile = await exchangeCodeForProfile({
			providerId,
			code,
			clientId: config.clientId,
			clientSecret: config.clientSecret,
			codeVerifier: stateCookie.codeVerifier,
		});

		if (!profile.email && providerId === "instagram") {
			await clearOAuthPendingCookie();
			await setOAuthPendingCookie({
				kind: "pending",
				provider: providerId,
				providerAccountId: profile.providerAccountId,
				displayName: profile.name ?? undefined,
				avatarUrl: profile.avatarUrl ?? undefined,
			});
			return buildLoginRedirect(req, "?oauth_complete=instagram");
		}

		const user = await findOrCreateOAuthUser({
			provider: providerId,
			providerAccountId: profile.providerAccountId,
			email: profile.email,
			name: profile.name,
			avatarUrl: profile.avatarUrl,
			verified: profile.emailVerified === true || providerId !== "instagram",
		});
		await clearOAuthPendingCookie();
		await mergeGuestCartIntoUserCart(user.id);
		const target = await resolvePostAuthRedirect(user.id);
		const session = await createPersistentSession(user);
		const redirectRes = NextResponse.redirect(new URL(target, req.url));
		redirectRes.cookies.set({
			name: "session",
			value: session.jwt,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			expires: new Date(session.expires),
		});
		return redirectRes;
	} catch (error) {
		if (error instanceof Error && error.message.includes("blocked")) {
			return buildLoginRedirect(req, "?oauth_error=blocked");
		}
		console.error(`[oauth callback:${providerId}]`, error);
		return buildLoginRedirect(req, `?oauth_error=${providerId}`);
	}
}
