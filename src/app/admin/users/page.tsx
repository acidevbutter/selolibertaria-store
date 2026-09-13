import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DataTable } from "@/app/admin/_components/ui/DataTable";
import { StatusBadge } from "@/app/admin/_components/ui/StatusBadge";
import { env } from "@/env.mjs";
import { auth } from "@/lib/auth";
import { hasCapability, normalizeUserRole } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";

function formatRoleLabel(role: "admin" | "vendor" | "customer") {
	switch (role) {
		case "admin":
			return "Administrador";
		case "vendor":
			return "Vendedor";
		default:
			return "Cliente";
	}
}

export default async function AdminUsersPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "customers.read")) redirect("/forbidden");
	const token = (await cookies()).get("session")?.value;
	if (!token) redirect("/login");
	interface UserLite {
		id: string;
		email: string;
		name?: string;
		role?: "admin" | "vendor" | "customer";
		access?: { blockedAt?: Date | string | null } | null;
	}
	const response = await fetch(`${env.FASTAPI_API_URL}/users/?page=1&page_size=50`, {
		headers: { authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	if (!response.ok) redirect("/forbidden");
	const body = (await response.json()) as {
		items: Array<Omit<UserLite, "access"> & { blocked_at: string | null }>;
	};
	const users: UserLite[] = body.items.map((user) => ({
		...user,
		access: { blockedAt: user.blocked_at },
	}));

	const blockedCount = users.filter((user) => Boolean(user.access?.blockedAt)).length;
	const adminCount = users.filter((user) => normalizeUserRole(user.role) === "admin").length;
	const vendorCount = users.filter((user) => normalizeUserRole(user.role) === "vendor").length;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Usuários"
				title="Usuários"
				description="Acompanhe acesso, papéis e bloqueios."
			/>
			<div className="grid gap-5 lg:grid-cols-4">
				<AdminEditorialStat label="Listados" value={users.length} helper="Até 50 pessoas no filtro atual." />
				<AdminEditorialStat
					label="Administradores"
					value={adminCount}
					helper="Pessoas com acesso total ao painel administrativo."
				/>
				<AdminEditorialStat
					label="Vendedores"
					value={vendorCount}
					helper="Perfis internos ligados a operação comercial."
				/>
				<AdminEditorialStat label="Bloqueados" value={blockedCount} helper="Contas com acesso suspenso." />
			</div>
			<EditorialPanel className="p-0">
				<div className="border-b border-[var(--sl-line)] px-6 py-5 sm:px-8">
					<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
						Cadastros recentes
					</div>
				</div>
				<div className="p-6 sm:p-8">
					<DataTable<UserLite>
						columns={[
							{
								key: "email",
								label: "E-mail",
								render: (u) => <span className="font-medium break-all">{u.email}</span>,
							},
							{ key: "name", label: "Nome", render: (u) => u.name || "Nome não informado" },
							{
								key: "role",
								label: "Papel",
								render: (u) => (
									<span className="text-[11px] tracking-[0.18em] text-[var(--sl-text-muted)] uppercase">
										{formatRoleLabel(normalizeUserRole(u.role))}
									</span>
								),
							},
							{
								key: "status",
								label: "Status",
								render: (u) => (
									<StatusBadge tone={u.access?.blockedAt ? "alert" : "active"}>
										{u.access?.blockedAt ? "Bloqueado" : "Ativo"}
									</StatusBadge>
								),
							},
							{
								key: "actions",
								label: "",
								render: (u) => (
									<Link
										className="text-sm font-semibold text-[var(--sl-accent)] underline underline-offset-4"
										href={`/admin/users/${u.id}`}
									>
										Ver usuário
									</Link>
								),
							},
						]}
						rows={users}
						empty="Nenhum usuário encontrado."
					/>
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
