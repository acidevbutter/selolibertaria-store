import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminEditorialHero, AdminEditorialPage, EditorialPanel } from "@/ui/editorial/editorial-primitives";
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
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Configurações"
				title="Infraestrutura, identidade operacional e preferências do painel."
				description="Regionalização, provedores de entrega, autenticação social e email de suporte ficam agrupados em blocos editoriais mais legíveis."
			/>
			<div className="grid gap-5 xl:grid-cols-2">
				<EditorialPanel className="p-0">
					<Card className="border-none bg-transparent shadow-none">
						<CardHeader>
							<CardTitle>Tema</CardTitle>
						</CardHeader>
						<CardContent>
							<AdminThemeSelector />
						</CardContent>
					</Card>
				</EditorialPanel>
				<EditorialPanel className="p-0">
					<Card className="border-none bg-transparent shadow-none">
						<CardHeader>
							<CardTitle>Padrões regionais</CardTitle>
						</CardHeader>
						<CardContent>
							<AdminRegionalSettings />
						</CardContent>
					</Card>
				</EditorialPanel>
				<EditorialPanel className="p-0">
					<Card className="border-none bg-transparent shadow-none">
						<CardHeader>
							<CardTitle>Email de suporte</CardTitle>
						</CardHeader>
						<CardContent>
							<AdminSupportEmail />
						</CardContent>
					</Card>
				</EditorialPanel>
				<EditorialPanel className="p-0">
					<Card className="border-none bg-transparent shadow-none">
						<CardHeader>
							<CardTitle>Provedores OAuth</CardTitle>
						</CardHeader>
						<CardContent>
							<AdminOAuthProviders />
						</CardContent>
					</Card>
				</EditorialPanel>
				<EditorialPanel className="p-0 xl:col-span-2">
					<Card className="border-none bg-transparent shadow-none">
						<CardHeader>
							<CardTitle>Provedores de frete</CardTitle>
						</CardHeader>
						<CardContent>
							<AdminShippingProviders />
						</CardContent>
					</Card>
				</EditorialPanel>
			</div>
		</AdminEditorialPage>
	);
}
