import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCatalogProductById } from "@/lib/catalog";
import { listPresales } from "@/lib/presales";
import {
	AdminEditorialEmptyState,
	AdminEditorialHero,
	AdminEditorialPage,
} from "@/ui/editorial/editorial-primitives";
import { Button } from "@/ui/shadcn/button";
import { PresaleRow } from "./presale-row.client";

export const dynamic = "force-dynamic";

export default async function AdminPreSalePage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (session.user.role !== "admin") redirect("/forbidden");

	const presales = await listPresales();
	const rows = await Promise.all(
		presales.map(async (presale) => ({
			presale,
			productName: (await getCatalogProductById(presale.productId))?.name ?? presale.productId,
		})),
	);

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Pré-vendas"
				title="Pré-vendas"
				description="Descontos com data de estreia, aviso no site e reservas que não podem ser apagadas."
				actions={
					<Link href="/admin/pre-venda/nova">
						<Button type="button">Nova pré-venda</Button>
					</Link>
				}
			/>
			{rows.length === 0 ? (
				<AdminEditorialEmptyState
					title="Nenhuma pré-venda"
					description="A primeira abre quando você marcar uma data de estreia em um produto."
				/>
			) : (
				<div className="space-y-3">
					<div className="grid grid-cols-[minmax(0,2fr)_100px_90px_110px_100px] gap-3 px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
						<span>Produto</span>
						<span>Estado</span>
						<span>Reservas</span>
						<span>A cobrar</span>
						<span>Estreia</span>
					</div>
					{rows.map(({ presale, productName }) => (
						<PresaleRow key={presale.id} presale={presale} productName={productName} />
					))}
				</div>
			)}
		</AdminEditorialPage>
	);
}
