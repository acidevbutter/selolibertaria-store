import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPresale, listPresaleReservations } from "@/lib/presales";
import { AdminEditorialHero, AdminEditorialPage } from "@/ui/editorial/editorial-primitives";

export const dynamic = "force-dynamic";

function brl(cents: number) {
	return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function PresaleReservationsPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (session.user.role !== "admin") redirect("/forbidden");

	const { id } = await params;
	const presale = await getPresale(id);
	if (!presale) notFound();
	const reservations = await listPresaleReservations(id);

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Pré-vendas / Reservas"
				title="Reservas"
				description={
					<>
						{reservations.length} reserva(s) · total a cobrar {brl(presale.amountToCharge)}.{" "}
						<Link href="/admin/pre-venda" className="underline underline-offset-4">
							Voltar
						</Link>
					</>
				}
			/>
			<div className="border border-[var(--sl-line)] bg-[var(--sl-paper)]">
				<div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_110px_140px] gap-3 border-b border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
					<span>Pedido</span>
					<span>Cliente</span>
					<span>Valor</span>
					<span>Reservado em</span>
				</div>
				{reservations.length === 0 ? (
					<div className="px-5 py-8 text-sm text-[var(--sl-text-muted)]">Nenhuma reserva ainda.</div>
				) : (
					reservations.map((reservation) => (
						<div
							key={reservation.id}
							className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_110px_140px] gap-3 border-b border-[var(--sl-line)] px-5 py-3 text-sm last:border-0"
						>
							<Link
								href={`/admin/orders/${reservation.orderId}`}
								className="truncate font-mono underline underline-offset-4"
							>
								{reservation.orderId}
							</Link>
							<span className="truncate font-mono text-xs text-[var(--sl-text-muted)]">
								{reservation.userId ?? "—"}
							</span>
							<span className="font-mono">{brl(reservation.amount)}</span>
							<span className="font-mono text-xs">
								{new Date(reservation.createdAt).toLocaleString("pt-BR")}
							</span>
						</div>
					))
				)}
			</div>
		</AdminEditorialPage>
	);
}
