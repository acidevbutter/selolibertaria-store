export type OAuthProviderId = "google" | "facebook" | "instagram";

export type OAuthProviderDefinition = {
	id: OAuthProviderId;
	label: string;
	authorizationUrl: string;
	tokenUrl: string;
	userInfoUrl: string;
	defaultScopes: string[];
	needsEmailCompletion?: boolean;
};

export const OAUTH_PROVIDER_DEFINITIONS: Record<OAuthProviderId, OAuthProviderDefinition> = {
	google: {
		id: "google",
		label: "Google",
		authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
		defaultScopes: ["openid", "email", "profile"],
	},
	facebook: {
		id: "facebook",
		label: "Facebook",
		authorizationUrl: "https://www.facebook.com/dialog/oauth",
		tokenUrl: "https://graph.facebook.com/oauth/access_token",
		userInfoUrl: "https://graph.facebook.com/me",
		defaultScopes: ["email", "public_profile"],
	},
	instagram: {
		id: "instagram",
		label: "Instagram",
		authorizationUrl: "https://api.instagram.com/oauth/authorize",
		tokenUrl: "https://api.instagram.com/oauth/access_token",
		userInfoUrl: "https://graph.instagram.com/me",
		defaultScopes: ["user_profile"],
		needsEmailCompletion: true,
	},
};

export const OAUTH_PROVIDER_IDS = Object.keys(OAUTH_PROVIDER_DEFINITIONS) as OAuthProviderId[];
