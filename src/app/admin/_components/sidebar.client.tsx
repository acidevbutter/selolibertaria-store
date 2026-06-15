"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminNavItems, type NavItem } from "@/app/admin/_components/nav-config";
import { hasCapability, type UserRole } from "@/lib/authz";
import { cn } from "@/lib/utils";

type SidebarUser = { name?: string | null; email?: string | null; role?: UserRole };

export function AdminSidebar({
	user,
	logoutAction,
}: {
	user?: SidebarUser;
	logoutAction: () => Promise<void>;
}) {
	const pathname = usePathname();
	const [navigating, setNavigating] = useState(false);
	const visibleNavItems = adminNavItems.filter((item) => hasCapability(user?.role, item.capability));
	useEffect(() => {
		setNavigating(false);
	}, [pathname]);
	return (
		<aside className="sticky top-0 hidden h-dvh w-[300px] shrink-0 overflow-hidden bg-[#0b0b0b] text-[color:var(--editorial-paper)] md:flex md:flex-col">
			<div className="border-b border-white/10 px-6 pb-6 pt-7">
				<Link href="/admin" className="block">
					<div className="text-[1.35rem] font-black uppercase leading-[0.94] tracking-[0.08em] text-[color:var(--editorial-paper)]">
						SELO
						<br />
						LIBERTÁRIA
						<br />
						ADMIN
					</div>
				</Link>
				<div className="mt-3 flex items-center justify-between gap-3">
					<div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
						Painel editorial
					</div>
					<form action={logoutAction}>
						<button
							type="submit"
							className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/52 transition-colors hover:text-[color:var(--editorial-paper)]"
						>
							Logout
						</button>
					</form>
				</div>
			</div>
			<nav className="flex-1 space-y-1 px-0 py-4">
				{visibleNavItems.map(({ href, label, icon: Icon }: NavItem) => {
					const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
					return (
						<Link
							key={href}
							href={href}
							onClick={(e) => {
								if (active) {
									e.preventDefault();
									return;
								}
								setNavigating(true);
							}}
							className={cn(
								"flex w-full items-center gap-3 border-l-2 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors",
								active
									? "border-[color:var(--editorial-accent)] bg-white/6 text-[color:var(--editorial-paper)]"
									: "border-transparent text-white/62 hover:border-white/18 hover:bg-white/4 hover:text-[color:var(--editorial-paper)]",
							)}
						>
							{Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
							<span>{label}</span>
						</Link>
					);
				})}
			</nav>
			<div className="mt-auto border-t border-white/10 px-6 py-4">
				<div className="text-xs text-white/60">
					<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Sessão</div>
					<div className="mt-2 text-sm font-semibold text-[color:var(--editorial-paper)]">
						{user?.name ?? user?.email ?? "Authenticated"}
					</div>
					<div className="mt-1 truncate text-xs text-white/66">{user?.email ?? ""}</div>
				</div>
			</div>
			{navigating && (
				<div className="absolute inset-0 z-50 grid place-items-center bg-black/55">
					<Loader2 className="h-6 w-6 animate-spin text-[color:var(--editorial-paper)]" />
				</div>
			)}
		</aside>
	);
}
