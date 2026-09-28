import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MetricCard } from "@/app/admin/_components/ui/MetricCard";
import { setUserBlockedAction, updateUserRoleAction } from "@/app/admin/users/actions";
import { env } from "@/env.mjs";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { hasCapability, isUserBlocked, normalizeUserRole, type UserRole } from "@/lib/authz";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
import { Reveal } from "@/ui/motion/reveal";
import { StatusBadge } from "@/ui/status-badge";

function getRoleLabel(role: UserRole | undefined) {
	switch (normalizeUserRole(role)) {
		case "admin":
			return "Administrador";
		case "vendor":
			return "Vendedor";
		default:
			return "Cliente";
	}
}

export default async function AdminUserDetails({ params }: { params: Promise<{ id: string }> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "customers.read")) redirect("/forbidden");
	const locale = (await getDefaultLocaleSetting()) ?? DEFAULT_LOCALE;

	const { id } = await params;
	if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/users");
	const token = (await cookies()).get("session")?.value;
	if (!token) redirect("/login");
	const headers = { authorization: `Bearer ${token}` };
	const [userResponse, ordersResponse] = await Promise.all([
		fetch(`${env.FASTAPI_API_URL}/users/${encodeURIComponent(id)}`, { headers, cache: "no-store" }),
		fetch(`${env.FASTAPI_API_URL}/orders/?page=1&page_size=200&user_id=${encodeURIComponent(id)}`, {
			headers,
			cache: "no-store",
		}),
	]);
	if (!userResponse.ok) redirect("/admin/users");
	const remote = (await userResponse.json()) as Record<string, unknown>;
	const orders = ordersResponse.ok
		? ((await ordersResponse.json()) as { items: Array<{ id: string; status: string; created_at: string }> })
				.items
		: [];
	const user = {
		email: String(remote.email),
		name: typeof remote.name === "string" ? remote.name : undefined,
		role: remote.role as UserRole | undefined,
		phone: typeof remote.phone === "string" ? remote.phone : undefined,
		address: {
			line1: remote.address_line1 as string | undefined,
			city: remote.address_city as string | undefined,
			state: remote.address_state as string | undefined,
			postalCode: remote.address_postal_code as string | undefined,
			country: remote.address_country as string | undefined,
		},
		access: {
			blockedAt: remote.blocked_at as string | null,
			blockedBy: remote.blocked_by as string | null,
			blockedReason: remote.blocked_reason as string | null,
		},
		purchases: orders.map((order) => ({ id: order.id, status: order.status, createdAt: order.created_at })),
	};
	const canManageStaff = hasCapability(session.user.role, "staff.manage");
	const role = normalizeUserRole(user.role);
	const roleLabel = getRoleLabel(user.role);
	const blocked = isUserBlocked(user);
	const purchaseCount = user.purchases?.length ?? 0;
	const addressSummary = user.address
		? [
				user.address.line1,
				user.address.city,
				user.address.state,
				user.address.postalCode,
				user.address.country,
			]
				.filter(Boolean)
				.join(", ")
		: null;

	return (
		<>
			<Reveal>
				<div className="ad-head">
					<h1>{user.name || user.email}</h1>
					<span className="ad-meta">Revise perfil, acesso e histórico de compras em uma leitura direta.</span>
					<div className="ad-acts">
						<Link className="ad-btn ad-sec" href="/admin/users">
							Voltar para usuários
						</Link>
					</div>
				</div>
			</Reveal>
			<Reveal delay={0.04}>
				<div className="grid gap-5 lg:grid-cols-4">
					<MetricCard label="Papel" value={roleLabel} note="Permissão atual desta conta." />
					<MetricCard
						label="Acesso"
						value={blocked ? "Bloqueado" : "Ativo"}
						note="Situação atual desta conta."
						tone={blocked ? "danger" : "default"}
					/>
					<MetricCard label="Compras" value={purchaseCount} note="Pedidos associados a este cadastro." />
					<MetricCard
						label="Ações sensíveis"
						value={canManageStaff ? "Liberadas" : "Somente leitura"}
						note="Disponibilidade de ações sensíveis nesta tela."
					/>
				</div>
			</Reveal>
			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
				<div className="space-y-6">
					<Reveal delay={0.08}>
						<div className="ad-panel">
							<div style={{ padding: 24 }} className="space-y-5">
								<h2 className="ad-eb">Dados principais do cadastro</h2>
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-1">
										<div className="text-xs uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
											E-mail
										</div>
										<div className="break-all text-sm text-[var(--sl-ink)]">{user.email}</div>
									</div>
									<div className="space-y-1">
										<div className="text-xs uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
											Nome
										</div>
										<div className="text-sm text-[var(--sl-ink)]">{user.name || "Nome não informado"}</div>
									</div>
									<div className="space-y-1">
										<div className="text-xs uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
											Telefone
										</div>
										<div className="text-sm text-[var(--sl-ink)]">
											{user.phone || "Telefone não informado"}
										</div>
									</div>
									<div className="space-y-1">
										<div className="text-xs uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
											Estado de acesso
										</div>
										<div
											className={`text-sm font-medium ${blocked ? "text-[var(--sl-danger)]" : "text-[var(--sl-ink)]"}`}
										>
											{blocked ? "Bloqueado" : "Ativo"}
										</div>
									</div>
									<div className="space-y-1 sm:col-span-2">
										<div className="text-xs uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
											Endereço
										</div>
										<div className="text-sm text-[var(--sl-ink)]">
											{addressSummary || "Nenhum endereço salvo."}
										</div>
									</div>
								</div>
							</div>
						</div>
					</Reveal>

					<Reveal delay={0.12}>
						<div className="ad-panel">
							<div className="border-b border-[var(--ad-line)] px-6 py-5 sm:px-8">
								<h2 className="ad-eb">Compras</h2>
							</div>
							<div className="p-6 sm:p-8">
								<ul className="divide-y divide-[var(--sl-line)]">
									{(user.purchases || []).map(
										(p: { id: string; status: string; createdAt: string | Date }) => (
											<li key={p.id} className="flex items-center justify-between gap-3 py-4">
												<div className="min-w-0">
													<div className="font-medium text-[var(--sl-ink)]">
														<StatusBadge status={p.status} />
													</div>
													<div className="text-sm text-[var(--sl-text-muted)]">
														{new Intl.DateTimeFormat(locale, {
															dateStyle: "short",
															timeStyle: "short",
														}).format(new Date(p.createdAt))}
													</div>
												</div>
												<div className="text-right">
													<div className="font-mono text-xs break-all text-[var(--sl-text-muted)]">
														{p.id}
													</div>
													<Link
														href={`/admin/orders/${p.id}`}
														className="mt-2 inline-flex text-sm font-semibold text-[var(--sl-accent)] underline underline-offset-4"
													>
														Ver pedido
													</Link>
												</div>
											</li>
										),
									)}
									{(!user.purchases || user.purchases.length === 0) && (
										<li className="py-6 text-[var(--sl-text-muted)]">Nenhuma compra registrada.</li>
									)}
								</ul>
							</div>
						</div>
					</Reveal>
				</div>

				{canManageStaff ? (
					<Reveal delay={0.1}>
						<div className="ad-panel">
							<div style={{ padding: 24 }} className="space-y-6">
								<div className="space-y-2">
									<h2 className="ad-eb">Gestão de acesso</h2>
									<p className="text-sm leading-6 text-[var(--sl-text-muted)]">
										Somente admins podem alterar papel ou bloquear acesso. Toda mudança revoga sessões ativas
										imediatamente.
									</p>
									{blocked && user.access?.blockedReason ? (
										<p className="text-sm leading-6 text-[var(--sl-danger)]">
											Motivo atual: {user.access.blockedReason}
										</p>
									) : null}
								</div>
								<form
									action={updateUserRoleAction}
									className="space-y-3 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-4"
								>
									<input type="hidden" name="userId" value={id} />
									<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
										<label className="grid gap-2">
											<span className="text-sm font-medium">Papel</span>
											<select
												name="role"
												defaultValue={role}
												className="min-w-48 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-3 py-2 text-sm"
												style={{ borderRadius: "var(--sl-radius)" }}
											>
												<option value="customer">Cliente</option>
												<option value="vendor">Vendedor</option>
												<option value="admin">Administrador</option>
											</select>
										</label>
										<button type="submit" className="ad-btn ad-pri">
											Atualizar papel
										</button>
									</div>
								</form>
								<form
									action={setUserBlockedAction}
									className="space-y-3 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-4"
								>
									<input type="hidden" name="userId" value={id} />
									<input type="hidden" name="blocked" value={blocked ? "false" : "true"} />
									<label className="grid gap-2">
										<span className="text-sm font-medium">
											{blocked ? "Nota de desbloqueio" : "Motivo do bloqueio"}
										</span>
										<textarea
											name="reason"
											rows={3}
											defaultValue={user.access?.blockedReason ?? ""}
											placeholder={
												blocked
													? "Opcionalmente registre a observação do desbloqueio"
													: "Descreva por que esta conta está sendo bloqueada"
											}
											className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-3 py-2 text-sm"
											style={{ borderRadius: "var(--sl-radius)" }}
										/>
									</label>
									<button type="submit" className={`ad-btn ${blocked ? "ad-sec" : "ad-pri"}`}>
										{blocked ? "Desbloquear usuário" : "Bloquear usuário"}
									</button>
								</form>
							</div>
						</div>
					</Reveal>
				) : null}
			</div>
		</>
	);
}
