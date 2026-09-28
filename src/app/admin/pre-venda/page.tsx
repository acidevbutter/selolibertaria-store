import { redirect } from "next/navigation";
import { PresaleAdminScreen } from "@/app/admin/pre-venda/_components/presale-admin-screen.client";
import { listPresalesAction } from "@/app/admin/pre-venda/presale-actions";
import { auth } from "@/lib/auth";
import { hasCapability, normalizeUserRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function AdminPreSalePage() {
	const session = await auth();
	if (!session) redirect("/login");
	const role = normalizeUserRole(session.user.role);
	if (!hasCapability(role, "presale.read")) redirect("/forbidden");

	const presales = await listPresalesAction();

	return (
		<>
			<div className="ad-head">
				<h1>Pré-vendas</h1>
				<span className="ad-meta">
					Preço, data de estreia e aviso no site — ligado direto ao checkout, sem depender de variável de
					ambiente.
				</span>
			</div>
			<PresaleAdminScreen initialPresales={presales} canWrite={hasCapability(role, "presale.write")} />
		</>
	);
}
