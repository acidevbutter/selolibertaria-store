import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import AdminOAuthProviders from "../_components/admin-oauth-providers.client";
import AdminRegionalSettings from "../_components/admin-regional-settings.client";
import AdminShippingProviders from "../_components/admin-shipping-providers.client";
import AdminSupportEmail from "../_components/admin-support-email.client";
import { AdminThemeSelector } from "./theme-selector.client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (session.user.role !== "admin") redirect("/forbidden");

	return (
		<main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 bg-background text-foreground">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold">Settings</h1>
				<p className="text-muted-foreground">Admin panel preferences</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Theme</CardTitle>
				</CardHeader>
				<CardContent>
					<AdminThemeSelector />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Regional defaults</CardTitle>
				</CardHeader>
				<CardContent>
					<AdminRegionalSettings />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Support email</CardTitle>
				</CardHeader>
				<CardContent>
					<AdminSupportEmail />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>OAuth providers</CardTitle>
				</CardHeader>
				<CardContent>
					<AdminOAuthProviders />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Shipping providers</CardTitle>
				</CardHeader>
				<CardContent>
					<AdminShippingProviders />
				</CardContent>
			</Card>
		</main>
	);
}
