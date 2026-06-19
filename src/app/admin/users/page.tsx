import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasCapability, normalizeUserRole } from "@/lib/authz";
import { getDb } from "@/lib/mongodb";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/shadcn/table";

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

	const db = await getDb();
	interface UserLite {
		_id: unknown;
		email: string;
		name?: string;
		role?: "admin" | "vendor" | "customer";
		access?: { blockedAt?: Date | string | null } | null;
	}
	const users = (await db
		.collection("users")
		.find({}, { projection: { passwordHash: 0 } })
		.sort({ createdAt: -1 })
		.limit(50)
		.toArray()) as unknown as UserLite[];

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
				<AdminEditorialStat label="Listados" value={users.length} helper="Até 50 cadastros mais recentes." />
				<AdminEditorialStat
					label="Administradores"
					value={adminCount}
					helper="Pessoas com acesso total ao painel administrativo."
				/>
				<AdminEditorialStat
					label="Vendedores"
					value={vendorCount}
					helper="Perfis internos com escopo comercial."
				/>
				<AdminEditorialStat
					label="Bloqueados"
					value={blockedCount}
					helper="Cadastros com acesso interrompido."
				/>
			</div>
			<EditorialPanel className="p-0">
				<div className="border-b border-[color:var(--editorial-border)] px-6 py-5 sm:px-8">
					<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
						Cadastros recentes
					</div>
				</div>
				<div className="p-6 sm:p-8">
					<div className="w-full overflow-x-auto">
						<Table className="min-w-[720px]">
							<TableHeader>
								<TableRow>
									<TableHead>Email</TableHead>
									<TableHead>Nome</TableHead>
									<TableHead>Papel</TableHead>
									<TableHead>Status</TableHead>
									<TableHead></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((u: UserLite) => {
									const role = normalizeUserRole(u.role);
									return (
										<TableRow key={String(u._id)}>
											<TableCell className="font-medium break-all sm:break-normal">{u.email}</TableCell>
											<TableCell>{u.name || "—"}</TableCell>
											<TableCell className="uppercase text-[11px] tracking-[0.18em] text-[color:var(--editorial-muted)]">
												{formatRoleLabel(role)}
											</TableCell>
											<TableCell>
												{u.access?.blockedAt ? (
													<span className="inline-flex items-center rounded-full border border-[#ead2ce] bg-[#f5dfdc] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a02a2a]">
														Bloqueado
													</span>
												) : (
													<span className="inline-flex items-center rounded-full border border-[#bed9ca] bg-[#dfeee6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#23634a]">
														Ativo
													</span>
												)}
											</TableCell>
											<TableCell className="text-right">
												<Link
													className="text-sm font-semibold text-[color:var(--editorial-accent)] underline underline-offset-4"
													href={`/admin/users/${String(u._id)}`}
												>
													Abrir
												</Link>
											</TableCell>
										</TableRow>
									);
								})}
								{users.length === 0 && (
									<TableRow>
										<TableCell colSpan={5} className="py-6 text-[color:var(--editorial-muted)]">
											Nenhum usuário encontrado.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
