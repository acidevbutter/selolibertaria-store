"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminNavItems, type NavItem } from "@/app/admin/_components/nav-config";
import { useTranslations } from "@/i18n/client";
import { hasCapability, type UserRole } from "@/lib/authz";
import { cn } from "@/lib/utils";

type SidebarUser = {
	name?: string | null;
	email?: string | null;
	role?: UserRole;
};

function AdminBrandMark({ size = 44 }: { size?: number }) {
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

export function AdminSidebar({
	user,
	logoutAction,
}: {
	user?: SidebarUser;
	logoutAction: () => Promise<void>;
}) {
	const pathname = usePathname();
	const t = useTranslations("AdminShell");
	const [navigatingHref, setNavigatingHref] = useState<string | null>(null);
	const visibleNavItems = adminNavItems.filter((item) => hasCapability(user?.role, item.capability));

	useEffect(() => {
		setNavigatingHref(null);
	}, [pathname]);

	return (
		<aside className="sticky top-0 relative hidden h-dvh w-[264px] shrink-0 overflow-hidden bg-[var(--sl-ink)] text-[var(--sl-text-on-ink)] md:flex md:flex-col">
			<div className="px-7 pb-7 pt-7">
				<Link href="/admin" className="flex items-start gap-4">
					<AdminBrandMark />
					<div className="space-y-1">
						<div className="text-base font-bold uppercase leading-[1.05] tracking-[0.06em] text-[var(--sl-text-on-ink)]">
							LIBERTÁRIA
						</div>
						<div className="text-xs font-medium leading-4 text-[var(--sl-text-on-ink-soft)]">
							{t("brandSubtitle")}
						</div>
					</div>
				</Link>
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

			<nav className="space-y-1 py-4">
				{visibleNavItems.map(({ href, label }: NavItem) => {
					const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
					const loading = navigatingHref === href;

					return (
						<Link
							key={href}
							href={href}
							onClick={(event) => {
								if (active) {
									event.preventDefault();
									return;
								}

								setNavigatingHref(href);
							}}
							className={cn(
								"flex w-full items-center px-3 py-3 text-sm tracking-[-0.01em] transition-opacity",
								active
									? "bg-[var(--sl-nav-selected)] font-black uppercase tracking-[.04em] text-[var(--sl-text-on-ink)]"
									: "font-medium text-[var(--sl-text-on-ink-soft)] hover:bg-[var(--sl-nav-hover-on-ink)] hover:text-[var(--sl-text-on-ink)]",
								loading && "opacity-60",
							)}
						>
							<span>{label}</span>
						</Link>
					);
				})}
			</nav>

			<div className="mt-auto px-7 pb-6 pt-4">
				<div className="h-px w-[208px] bg-[var(--sl-line-on-ink)]" />
				<div className="pt-7 text-xs text-[var(--sl-text-on-ink-soft)]">
					<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-on-ink-quiet)]">
						{t("sessionTitle")}
					</div>
					<div className="mt-2 text-sm font-semibold text-[var(--sl-text-on-ink)]">
						{user?.name ?? user?.email ?? t("authenticatedFallback")}
					</div>
					<div className="mt-1 truncate text-xs text-[var(--sl-text-on-ink-soft)]">{user?.email ?? ""}</div>
				</div>
			</div>

			{navigatingHref ? <div className="absolute inset-x-0 top-0 z-50 h-[2px] bg-[var(--sl-wine)]" /> : null}
		</aside>
	);
}
