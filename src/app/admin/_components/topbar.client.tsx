"use client";

import { Loader2, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminNavItems } from "@/app/admin/_components/nav-config";
import { hasCapability, type UserRole } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/ui/shadcn/sheet";

export function AdminTopbar({ role }: { role?: UserRole }) {
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
					Selo Libertária
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
						<div className="border-b border-white/10 px-6 pb-7 pt-8">
							<div className="editorial-serif text-[2.1rem] leading-[0.92] tracking-[-0.02em]">
								SELO
								<br />
								LIBERTÁRIA
							</div>
						</div>
						<nav className="space-y-1 px-4 py-6">
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
												"block border-l-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]",
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
