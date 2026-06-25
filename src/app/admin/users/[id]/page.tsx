import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setUserBlockedAction, updateUserRoleAction } from "@/app/admin/users/actions";
import { env } from "@/env.mjs";
import { resolveLocale } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { hasCapability, isUserBlocked, normalizeUserRole, type UserRole } from "@/lib/authz";
import { getDb } from "@/lib/mongodb";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { Reveal } from "@/ui/motion/reveal";
import { Button } from "@/ui/shadcn/button";
import { StatusBadge } from "@/ui/status-badge";

function isValidObjectId(id: string | undefined | null): id is string {
	return !!id && /^[0-9a-fA-F]{24}$/.test(id);
}

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
	const locale = (await getDefaultLocaleSetting()) ?? resolveLocale(env.NEXT_PUBLIC_LANGUAGE);

	const { id } = await params;
	if (!isValidObjectId(id)) redirect("/admin/users");

	const db = await getDb();
	const user = await db.collection("users").findOne<{
		_id: ObjectId;
		email: string;
		name?: string;
		role?: UserRole;
		phone?: string;
		address?: {
			line1?: string;
			city?: string;
			state?: string;
			postalCode?: string;
			country?: string;
		};
		access?: {
			blockedAt?: Date | string | null;
			blockedBy?: string | null;
			blockedReason?: string | null;
		} | null;
		purchases?: Array<{ id: string; status: string; createdAt: string | Date }>;
	}>({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });
	if (!user) redirect("/admin/users");
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
		<AdminEditorialPage>
			<Reveal>
				<AdminEditorialHero
					eyebrow="Usuário"
					title={user.name || user.email}
					description="Revise perfil, acesso e histórico de compras em uma leitura direta."
					actions={
						<Link
							href="/admin/users"
							className="inline-flex h-11 items-center justify-center rounded-none border border-[color:var(--editorial-border)] px-5 text-sm font-semibold text-[color:var(--editorial-ink)] transition-colors hover:bg-[#fbf7f1]"
						>
							Voltar para usuários
						</Link>
					}
				/>
			</Reveal>
			<Reveal delay={0.04}>
				<div className="grid gap-5 lg:grid-cols-4">
					<AdminEditorialStat label="Papel" value={roleLabel} helper="Permissão atual desta conta." />
					<AdminEditorialStat
						label="Acesso"
						value={blocked ? "Bloqueado" : "Ativo"}
						helper="Situação atual desta conta."
					/>
					<AdminEditorialStat
						label="Compras"
						value={purchaseCount}
						helper="Pedidos associados a este cadastro."
					/>
					<AdminEditorialStat
						label="Ações sensíveis"
						value={canManageStaff ? "Liberadas" : "Somente leitura"}
						helper="Disponibilidade de ações sensíveis nesta tela."
					/>
				</div>
			</Reveal>
			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
				<div className="space-y-6">
					<Reveal delay={0.08}>
						<EditorialPanel className="space-y-5">
							<div className="space-y-1">
								<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
									Perfil
								</div>
								<h2 className="editorial-serif text-2xl font-semibold text-[color:var(--editorial-ink)]">
									Dados principais do cadastro
								</h2>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-1">
									<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
										E-mail
									</div>
									<div className="break-all text-sm text-[color:var(--editorial-ink)]">{user.email}</div>
								</div>
								<div className="space-y-1">
									<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
										Nome
									</div>
									<div className="text-sm text-[color:var(--editorial-ink)]">
										{user.name || "Nome não informado"}
									</div>
								</div>
								<div className="space-y-1">
									<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
										Telefone
									</div>
									<div className="text-sm text-[color:var(--editorial-ink)]">
										{user.phone || "Telefone não informado"}
									</div>
								</div>
								<div className="space-y-1">
									<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
										Estado de acesso
									</div>
									<div
										className={
											blocked
												? "text-sm font-medium text-destructive"
												: "text-sm font-medium text-emerald-700"
										}
									>
										{blocked ? "Bloqueado" : "Ativo"}
									</div>
								</div>
								<div className="space-y-1 sm:col-span-2">
									<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
										Endereço
									</div>
									<div className="text-sm text-[color:var(--editorial-ink)]">
										{addressSummary || "Nenhum endereço salvo."}
									</div>
								</div>
							</div>
						</EditorialPanel>
					</Reveal>

					<Reveal delay={0.12}>
						<EditorialPanel className="p-0">
							<div className="border-b border-[color:var(--editorial-border)] px-6 py-5 sm:px-8">
								<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
									Compras
								</div>
							</div>
							<div className="p-6 sm:p-8">
								<ul className="divide-y divide-[color:var(--editorial-border)]">
									{(user.purchases || []).map(
										(p: { id: string; status: string; createdAt: string | Date }) => (
											<li key={p.id} className="flex items-center justify-between gap-3 py-4">
												<div className="min-w-0">
													<div className="font-medium text-[color:var(--editorial-ink)]">
														<StatusBadge status={p.status} />
													</div>
													<div className="text-sm text-[color:var(--editorial-muted)]">
														{new Intl.DateTimeFormat(locale, {
															dateStyle: "short",
															timeStyle: "short",
														}).format(new Date(p.createdAt))}
													</div>
												</div>
												<div className="text-right">
													<div className="font-mono text-xs break-all text-[color:var(--editorial-muted)]">
														{p.id}
													</div>
													<Link
														href={`/admin/orders/${p.id}`}
														className="mt-2 inline-flex text-sm font-semibold text-[color:var(--editorial-accent)] underline underline-offset-4"
													>
														Ver pedido
													</Link>
												</div>
											</li>
										),
									)}
									{(!user.purchases || user.purchases.length === 0) && (
										<li className="py-6 text-[color:var(--editorial-muted)]">Nenhuma compra registrada.</li>
									)}
								</ul>
							</div>
						</EditorialPanel>
					</Reveal>
				</div>

				{canManageStaff ? (
					<Reveal delay={0.1}>
						<EditorialPanel className="space-y-6">
							<div className="space-y-2">
								<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
									Gestão de acesso
								</div>
								<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
									Somente admins podem alterar papel ou bloquear acesso. Toda mudança revoga sessões ativas
									imediatamente.
								</p>
								{blocked && user.access?.blockedReason ? (
									<p className="text-sm leading-6 text-destructive">
										Motivo atual: {user.access.blockedReason}
									</p>
								) : null}
							</div>
							<form
								action={updateUserRoleAction}
								className="space-y-3 border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-4"
							>
								<input type="hidden" name="userId" value={id} />
								<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
									<label className="grid gap-2">
										<span className="text-sm font-medium">Papel</span>
										<select
											name="role"
											defaultValue={role}
											className="min-w-48 rounded-none border border-[color:var(--editorial-border)] bg-white px-3 py-2 text-sm"
										>
											<option value="customer">Cliente</option>
											<option value="vendor">Vendedor</option>
											<option value="admin">Administrador</option>
										</select>
									</label>
									<Button
										type="submit"
										className="rounded-none bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]"
									>
										Atualizar papel
									</Button>
								</div>
							</form>
							<form
								action={setUserBlockedAction}
								className="space-y-3 border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-4"
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
										className="rounded-none border border-[color:var(--editorial-border)] bg-white px-3 py-2 text-sm"
									/>
								</label>
								<Button
									type="submit"
									variant={blocked ? "secondary" : "destructive"}
									className="rounded-none"
								>
									{blocked ? "Desbloquear usuário" : "Bloquear usuário"}
								</Button>
							</form>
						</EditorialPanel>
					</Reveal>
				) : null}
			</div>
		</AdminEditorialPage>
	);
}
