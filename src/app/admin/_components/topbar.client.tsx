"use client";

import { Loader2, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminNavItems } from "@/app/admin/_components/nav-config";
import { useTranslations } from "@/i18n/client";
import { hasCapability, type UserRole } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/ui/shadcn/sheet";

export function AdminTopbar({ role, logoutAction }: { role?: UserRole; logoutAction: () => Promise<void> }) {
	const pathname = usePathname();
	const t = useTranslations("AdminShell");
	const [navigating, setNavigating] = useState(false);
	const visibleNavItems = adminNavItems.filter((item) => hasCapability(role, item.capability));
	useEffect(() => {
		setNavigating(false);
	}, [pathname]);
	return (
		<div className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0b] text-[color:var(--editorial-paper)] md:hidden">
			<div className="flex h-16 items-center justify-between px-5">
				<Link href="/admin" className="flex items-center gap-3">
					<div className="h-9 w-9 rounded-xl bg-[#fffdf8]" />
					<div className="space-y-0.5">
						<div className="text-sm font-bold uppercase tracking-[0.08em] text-[#fffdf8]">LIBERTÁRIA</div>
						<div className="text-[11px] font-medium text-[#beb3a8]">{t("brandSubtitle")}</div>
					</div>
				</Link>
				<Sheet>
					<SheetTrigger className="inline-flex items-center justify-center border border-white/14 p-2 transition-colors hover:bg-white/6">
						<Menu className="h-5 w-5" />
						<span className="sr-only">{t("openMenu")}</span>
					</SheetTrigger>
					<SheetContent
						side="left"
						className="w-[88vw] max-w-[320px] border-r border-white/10 bg-[#0b0b0b] p-0 text-[color:var(--editorial-paper)]"
					>
						<SheetTitle className="sr-only">{t("navTitle")}</SheetTitle>
						<div className="px-7 pb-7 pt-7">
							<div className="flex items-start gap-4">
								<div className="h-11 w-11 shrink-0 rounded-xl bg-[#fffdf8]" />
								<div className="space-y-1">
									<div className="text-base font-bold uppercase leading-[1.05] tracking-[0.06em] text-[#fffdf8]">
										LIBERTÁRIA
									</div>
									<div className="text-xs font-medium leading-4 text-[#beb3a8]">{t("brandSubtitle")}</div>
								</div>
							</div>
							<div className="mt-5 flex items-center justify-between gap-3">
								<div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/42">
									{t("sectionTitle")}
								</div>
								<form action={logoutAction}>
									<button
										type="submit"
										className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42 transition-colors hover:text-[#fffdf8]"
									>
										{t("logout")}
									</button>
								</form>
							</div>
						</div>
						<nav className="space-y-1 px-[18px] py-4">
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
												"flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium tracking-[-0.01em]",
												active
													? "bg-[#f7f1e8] text-[#0b0b0b]"
													: "text-[#cfc6bd] hover:bg-white/4 hover:text-[#fffdf8]",
											)}
										>
											<span
												className={cn(
													"h-1.5 w-1.5 shrink-0 rounded-full",
													active ? "bg-[#7a1e22]" : "bg-[#5c5450]",
												)}
											/>
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
