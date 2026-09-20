import { redirect } from "next/navigation";
import { PresaleAdminScreen } from "@/app/admin/pre-venda/_components/presale-admin-screen.client";
import { listPresalesAction } from "@/app/admin/pre-venda/presale-actions";
import { auth } from "@/lib/auth";
import { hasCapability, normalizeUserRole } from "@/lib/authz";
import { AdminEditorialHero, AdminEditorialPage } from "@/ui/editorial/editorial-primitives";

export const dynamic = "force-dynamic";

export default async function AdminPreSalePage() {
	const session = await auth();
	if (!session) redirect("/login");
	const role = normalizeUserRole(session.user.role);
	if (!hasCapability(role, "presale.read")) redirect("/forbidden");

	const presales = await listPresalesAction();

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Pré-venda"
				title="Pré-vendas"
				description="Preço, data de estreia e aviso no site — ligado direto ao checkout, sem depender de variável de ambiente."
			/>
			<PresaleAdminScreen initialPresales={presales} canWrite={hasCapability(role, "presale.write")} />
		</AdminEditorialPage>
	);
}
