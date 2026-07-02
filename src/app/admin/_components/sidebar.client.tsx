"use client";

import { Loader2 } from "lucide-react";
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
			className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-[#fffdf8] ring-1 ring-white/8"
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
	const [navigating, setNavigating] = useState(false);
	const visibleNavItems = adminNavItems.filter((item) => hasCapability(user?.role, item.capability));

	useEffect(() => {
		setNavigating(false);
	}, [pathname]);

	return (
		<aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 overflow-hidden bg-[#0b0b0b] text-[color:var(--editorial-paper)] md:flex md:flex-col">
			<div className="px-7 pb-7 pt-7">
				<Link href="/admin" className="flex items-start gap-4">
					<AdminBrandMark />
					<div className="space-y-1">
						<div className="text-base font-bold uppercase leading-[1.05] tracking-[0.06em] text-[#fffdf8]">
							LIBERTÁRIA
						</div>
						<div className="text-xs font-medium leading-4 text-[#beb3a8]">{t("brandSubtitle")}</div>
					</div>
				</Link>
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
				{visibleNavItems.map(({ href, label }: NavItem) => {
					const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href));

					return (
						<Link
							key={href}
							href={href}
							onClick={(event) => {
								if (active) {
									event.preventDefault();
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
								className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? "bg-[#7a1e22]" : "bg-[#5c5450]")}
							/>
							<span>{label}</span>
						</Link>
					);
				})}
			</nav>

			<div className="mt-auto px-7 pb-6 pt-4">
				<div className="h-px w-[208px] bg-[#2a2422]" />
				<div className="pt-7 text-xs text-white/60">
					<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9f948c]">
						{t("sessionTitle")}
					</div>
					<div className="mt-2 text-sm font-semibold text-[#fffdf8]">
						{user?.name ?? user?.email ?? t("authenticatedFallback")}
					</div>
					<div className="mt-1 truncate text-xs text-[#beb3a8]">{user?.email ?? ""}</div>
				</div>
			</div>

			{navigating ? (
				<div className="absolute inset-0 z-50 grid place-items-center bg-black/55">
					<Loader2 className="h-6 w-6 animate-spin text-[#fffdf8]" />
				</div>
			) : null}
		</aside>
	);
}
