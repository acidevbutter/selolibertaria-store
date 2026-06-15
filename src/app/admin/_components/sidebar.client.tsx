"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminNavItems, type NavItem } from "@/app/admin/_components/nav-config";
import { hasCapability, type UserRole } from "@/lib/authz";
import { cn } from "@/lib/utils";

type SidebarUser = { name?: string | null; email?: string | null; role?: UserRole };

export function AdminSidebar({ user }: { user?: SidebarUser }) {
	const pathname = usePathname();
	const [navigating, setNavigating] = useState(false);
	const visibleNavItems = adminNavItems.filter((item) => hasCapability(user?.role, item.capability));
	useEffect(() => {
		setNavigating(false);
	}, [pathname]);
	return (
		<aside className="sticky top-0 hidden h-dvh w-[300px] shrink-0 flex-col bg-[#0b0b0b] text-[color:var(--editorial-paper)] md:flex">
			<div className="border-b border-white/10 px-8 pb-9 pt-9">
				<Link href="/admin" className="block">
					<div className="editorial-serif text-[2.45rem] leading-[0.9] tracking-[-0.02em] text-[color:var(--editorial-paper)]">
						SELO
						<br />
						LIBERTÁRIA
					</div>
					<div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
						Painel editorial
					</div>
				</Link>
			</div>
			<nav className="space-y-1 px-6 py-8">
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
								"flex items-center gap-3 border-l-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
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
			<div className="mt-auto border-t border-white/10 px-8 py-6">
				<div className="text-xs text-white/60">
					<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Sessão</div>
					<div className="mt-3 text-sm font-semibold text-[color:var(--editorial-paper)]">
						{user?.name ?? user?.email ?? "Authenticated"}
					</div>
					<div className="mt-1 truncate text-sm text-white/66">{user?.email ?? ""}</div>
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
