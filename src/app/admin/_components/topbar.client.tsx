"use client";

import { Loader2, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminNavItems } from "@/app/admin/_components/nav-config";
import { hasCapability, type UserRole } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/ui/shadcn/sheet";

export function AdminTopbar({ role, logoutAction }: { role?: UserRole; logoutAction: () => Promise<void> }) {
	const pathname = usePathname();
	const [navigating, setNavigating] = useState(false);
	const visibleNavItems = adminNavItems.filter((item) => hasCapability(role, item.capability));
	useEffect(() => {
		setNavigating(false);
	}, [pathname]);
	return (
		<div className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0b] text-[color:var(--editorial-paper)] md:hidden">
			<div className="flex h-16 items-center justify-between px-5">
				<Link href="/admin" className="text-sm font-black uppercase tracking-[0.2em]">
					Selo Libertária Admin
				</Link>
				<Sheet>
					<SheetTrigger className="inline-flex items-center justify-center border border-white/14 p-2 transition-colors hover:bg-white/6">
						<Menu className="h-5 w-5" />
						<span className="sr-only">Abrir menu</span>
					</SheetTrigger>
					<SheetContent
						side="left"
						className="w-[88vw] max-w-[320px] border-r border-white/10 bg-[#0b0b0b] p-0 text-[color:var(--editorial-paper)]"
					>
						<SheetTitle className="sr-only">Menu de navegação</SheetTitle>
						<div className="border-b border-white/10 px-6 pb-6 pt-7">
							<div className="text-[1.2rem] font-black uppercase leading-[0.96] tracking-[0.08em]">
								SELO
								<br />
								LIBERTÁRIA
								<br />
								ADMIN
							</div>
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
						<nav className="space-y-1 px-0 py-4">
							{visibleNavItems.map(({ href, label }) => {
								const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
								return (
									<SheetClose asChild key={href}>
										<Link
											href={href}
											onClick={(e) => {
												if (active) {
													e.preventDefault();
													return;
												}
												setNavigating(true);
											}}
											className={cn(
												"block w-full border-l-2 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
												active
													? "border-[color:var(--editorial-accent)] bg-white/6 text-[color:var(--editorial-paper)]"
													: "border-transparent text-white/62 hover:border-white/18 hover:bg-white/4 hover:text-[color:var(--editorial-paper)]",
											)}
										>
											{label}
										</Link>
									</SheetClose>
								);
							})}
						</nav>
					</SheetContent>
				</Sheet>
			</div>
			{navigating && (
				<div className="fixed inset-0 z-[60] grid place-items-center bg-black/55">
					<Loader2 className="h-8 w-8 animate-spin text-[color:var(--editorial-paper)]" />
				</div>
			)}
		</div>
	);
}
