export type EmailProvider = "smtp" | "brevo";

export type SendEmailMode = "auto" | "api" | "smtp";

export function resolveEmailProviders(mode: SendEmailMode, hasApiProvider: boolean) {
	if (mode === "api") return ["brevo"] satisfies EmailProvider[];
	if (mode === "smtp") return ["smtp"] satisfies EmailProvider[];
	if (hasApiProvider) return ["brevo", "smtp"] satisfies EmailProvider[];
	return ["smtp"] satisfies EmailProvider[];
}
