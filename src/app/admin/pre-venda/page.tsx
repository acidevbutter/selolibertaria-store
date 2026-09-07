import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPreSaleAvailability } from "@/lib/pre-sale.server";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { AdminPreSaleToggle } from "./admin-pre-sale-toggle.client";

export const dynamic = "force-dynamic";

export default async function AdminPreSalePage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (session.user.role !== "admin") redirect("/forbidden");
	const availability = await getPreSaleAvailability();

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Pré-venda"
				title="Pré-venda"
				description="Agende a página e o modal de estreia sem depender de variável de ambiente."
			/>
			<div className="grid gap-5 lg:grid-cols-2">
				<AdminEditorialStat
					label="Página pública"
					value={availability.pageActive ? "Ativa" : "Inativa"}
					helper={
						availability.pageActive ? "A campanha está pública." : "A rota responde como não encontrada."
					}
				/>
				<AdminEditorialStat
					label="Modal no site"
					value={availability.popupActive ? "Ativo" : "Inativo"}
					helper={availability.inWindow ? "A janela de exibição está aberta." : "Fora da janela de exibição."}
				/>
			</div>
			<EditorialPanel className="mt-5">
				<AdminPreSaleToggle />
				<div className="mt-5 border-t border-[color:var(--editorial-border)] pt-4">
					<Link
						href="/pre-venda/little-fish-big-fish"
						target="_blank"
						className="text-sm font-medium text-[color:var(--editorial-accent)] underline-offset-4 hover:underline"
					>
						Ver página pública
					</Link>
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
