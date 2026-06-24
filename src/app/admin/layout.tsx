import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminThemeProvider } from "@/app/admin/_components/admin-theme-provider.client";
import { AdminSidebar } from "@/app/admin/_components/sidebar.client";
import { AdminTopbar } from "@/app/admin/_components/topbar.client";
import { getTranslations } from "@/i18n/server";
import { auth, logout } from "@/lib/auth";
import { isBackofficeRole, normalizeUserRole } from "@/lib/authz";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const session = await auth();
	if (!session) redirect("/login");
	const role = normalizeUserRole(session.user.role);
	if (!isBackofficeRole(role)) redirect("/forbidden");

	let initialTheme: "light" | "dark" = "light";
	const t = await getTranslations("AdminShell");
	try {
		const db = await getDb();
		const doc = await db.collection<{ current?: { theme?: "light" | "dark" } }>("settings").findOne({});
		if (doc?.current?.theme === "dark" || doc?.current?.theme === "light") initialTheme = doc.current.theme;
	} catch {}

	return (
		<AdminThemeProvider initialTheme={initialTheme}>
			<div className="min-h-dvh bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)]">
				<div className="max-w-none">
					<AdminTopbar role={role} logoutAction={logout} />
					<div className="flex min-h-dvh items-start">
						<AdminSidebar
							user={{ name: session.user.name, email: session.user.email, role }}
							logoutAction={logout}
						/>
						<div className="min-h-dvh flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
							<div className="mb-5">
								<Link
									href="/"
									className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
								>
									<ArrowLeft className="h-4 w-4" />
									{t("backToSite")}
								</Link>
							</div>
							{children}
						</div>
					</div>
				</div>
			</div>
		</AdminThemeProvider>
	);
}
