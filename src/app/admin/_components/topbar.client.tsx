"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminNavItems } from "@/app/admin/_components/nav-config";
import { useTranslations } from "@/i18n/client";
import { hasCapability, type UserRole } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/ui/shadcn/sheet";

function AdminBrandMark({ size = 36 }: { size?: number }) {
	return (
		<div
			className="grid shrink-0 place-items-center overflow-hidden bg-[var(--sl-paper)]"
			style={{ height: size, width: size }}
		>
			<Image
				src="/images/selolibertaria.png"
				alt="Logo do Selo Libertária"
				width={size}
				height={size}
				className="h-full w-full object-contain p-1.5"
				priority
			/>
		</div>
	);
}

export function AdminTopbar({ role, logoutAction }: { role?: UserRole; logoutAction: () => Promise<void> }) {
	const pathname = usePathname();
	const t = useTranslations("AdminShell");
	const [navigatingHref, setNavigatingHref] = useState<string | null>(null);
	const visibleNavItems = adminNavItems.filter((item) => hasCapability(role, item.capability));

	useEffect(() => {
		setNavigatingHref(null);
	}, [pathname]);

	return (
		<div className="sticky top-0 relative z-40 border-b border-[var(--sl-line-on-ink)] bg-[var(--sl-ink)] text-[var(--sl-text-on-ink)] md:hidden">
			<div className="flex h-16 items-center justify-between px-5">
				<Link href="/admin" className="flex items-center gap-3">
					<AdminBrandMark />
					<div className="space-y-0.5">
						<div className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--sl-text-on-ink)]">
							LIBERTÁRIA
						</div>
						<div className="text-[11px] font-medium text-[var(--sl-text-on-ink-soft)]">
							{t("brandSubtitle")}
						</div>
					</div>
				</Link>

				<Sheet>
					<SheetTrigger className="inline-flex items-center justify-center border border-[var(--sl-line-on-ink)] p-2 transition-colors hover:bg-[var(--sl-nav-hover-on-ink)]">
						<Menu className="h-5 w-5" />
						<span className="sr-only">{t("openMenu")}</span>
					</SheetTrigger>
					<SheetContent
						side="left"
						className="w-[88vw] max-w-[320px] border-r border-[var(--sl-line-on-ink)] bg-[var(--sl-ink)] p-0 text-[var(--sl-text-on-ink)]"
					>
						<SheetTitle className="sr-only">{t("navTitle")}</SheetTitle>
						<div className="px-7 pb-7 pt-7">
							<div className="flex items-start gap-4">
								<AdminBrandMark size={44} />
								<div className="space-y-1">
									<div className="text-base font-bold uppercase leading-[1.05] tracking-[0.06em] text-[var(--sl-text-on-ink)]">
										LIBERTÁRIA
									</div>
									<div className="text-xs font-medium leading-4 text-[var(--sl-text-on-ink-soft)]">
										{t("brandSubtitle")}
									</div>
								</div>
							</div>
							<div className="mt-5 flex items-center justify-between gap-3">
								<div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--sl-text-on-ink-quiet)]">
									{t("sectionTitle")}
								</div>
								<form action={logoutAction}>
									<button
										type="submit"
										className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sl-text-on-ink-quiet)] transition-colors hover:text-[var(--sl-text-on-ink)]"
									>
										{t("logout")}
									</button>
								</form>
							</div>
						</div>

						<nav className="space-y-1 px-[18px] py-4">
							{visibleNavItems.map(({ href, label }) => {
								const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
								const loading = navigatingHref === href;

								return (
									<SheetClose asChild key={href}>
										<Link
											href={href}
											onClick={(event) => {
												if (active) {
													event.preventDefault();
													return;
												}

												setNavigatingHref(href);
											}}
											className={cn(
												"flex w-full items-center gap-3 px-3 py-3 text-sm font-medium tracking-[-0.01em] transition-opacity",
												active
													? "bg-[var(--sl-paper)] text-[var(--sl-ink)]"
													: "text-[var(--sl-text-on-ink-soft)] hover:bg-[var(--sl-nav-hover-on-ink)] hover:text-[var(--sl-text-on-ink)]",
												loading && "opacity-60",
											)}
										>
											<span
												className={cn(
													"h-1.5 w-1.5 shrink-0",
													active ? "bg-[var(--sl-wine)]" : "bg-[var(--sl-line-on-ink)]",
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

			{navigatingHref ? <div className="absolute inset-x-0 top-0 z-50 h-[2px] bg-[var(--sl-wine)]" /> : null}
		</div>
	);
}
