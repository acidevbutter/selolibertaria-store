import { redirect } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { isBackofficeRole } from "@/lib/authz";
import { getDefaultCurrencyForLocale } from "@/lib/currency";
import { getPublicOAuthProviders } from "@/lib/oauth/config";
import { getDefaultCountrySetting } from "@/lib/settings-store";
import { Nav } from "@/ui/nav/nav";
import LoginShell from "./login-shell.client";

export default async function LoginPage() {
	const user = await auth();
	const role = user && typeof user === "object" && "role" in user ? user.role : null;
	if (user) redirect(isBackofficeRole(typeof role === "string" ? role : null) ? "/admin" : "/");
	const locale = await getLocale();
	const [providers, defaultCountry] = await Promise.all([
		getPublicOAuthProviders(),
		getDefaultCountrySetting(locale),
	]);
	return (
		<>
			<Nav hideAuthCta lightweight />
			<LoginShell
				defaultCountry={defaultCountry}
				defaultCurrency={getDefaultCurrencyForLocale(locale)}
				providers={providers}
			/>
		</>
	);
}
