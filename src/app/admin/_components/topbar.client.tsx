"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { useAdminRouteProgress } from "@/app/admin/_components/admin-route-progress.client";
import { useAdminSearchPalette } from "@/app/admin/_components/admin-search-palette.client";
import { adminNavGroups, resolveNavState } from "@/app/admin/_components/nav-config";
import { hasCapability, type UserRole } from "@/lib/authz";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/ui/shadcn/sheet";

function initialsOf(user?: { name?: string | null; email?: string | null }) {
	const source = user?.name?.trim() || user?.email?.trim() || "";
	if (!source) return "SL";
	const parts = source.split(/[\s@.]+/).filter(Boolean);
	const first = parts[0] ?? source;
	const second = parts[1];
	const letters = second ? `${first.charAt(0)}${second.charAt(0)}` : first.slice(0, 2);
	return letters.toUpperCase();
}

/**
 * Topbar (ui_kit `.topbar`, §2.1): 56px on the shell with the search field,
 * "Ver o site ↗" and the 28px paper avatar. The sheet keeps the rail reachable
 * below md, where the 264px rail is hidden.
 */
export function AdminTopbar({
	role,
	user,
	logoutAction,
}: {
	role?: UserRole;
	user?: { name?: string | null; email?: string | null };
	logoutAction: () => Promise<void>;
}) {
	const pathname = usePathname();
	const { pendingHref, navigate } = useAdminRouteProgress();
	const { open } = useAdminSearchPalette();
	const visibleGroups = adminNavGroups
		.map((group) => ({
			...group,
			items: group.items.filter((item) => hasCapability(role, item.capability)),
		}))
		.filter((group) => group.items.length > 0);

	return (
		<header className="ad-topbar">
			<Sheet>
				<SheetTrigger
					className="inline-flex items-center justify-center border md:hidden"
					style={{ borderColor: "var(--ad-shell-line)", padding: 8 }}
				>
					<Menu className="h-5 w-5" />
					<span className="sr-only">Abrir menu</span>
				</SheetTrigger>
				<SheetContent side="left" className="ad-rail w-[88vw] max-w-[320px] border-0 p-0">
					<SheetTitle className="sr-only">Painel editorial</SheetTitle>
					<div className="ad-lockup">
						<div>
							<b>Libertária</b>
							<i>Painel editorial</i>
						</div>
					</div>
					{visibleGroups.map((group) => (
						<Fragment key={group.label}>
							<div className="ad-grp">{group.label}</div>
							{group.items.map((item) => {
								const state = resolveNavState(pathname, item.href);
								const selected = state === "selected";

								return (
									<SheetClose asChild key={item.href}>
										<button
											type="button"
											className="ad-nav"
											aria-current={selected ? "page" : undefined}
											data-parent={state === "parent" || pendingHref === item.href ? "" : undefined}
											onClick={() => {
												if (selected) return;
												navigate(item.href);
											}}
										>
											{item.label}
										</button>
									</SheetClose>
								);
							})}
						</Fragment>
					))}
					<form action={logoutAction} className="ad-who">
						<button type="submit" className="ad-mono" style={{ fontSize: 11 }}>
							sair
						</button>
					</form>
				</SheetContent>
			</Sheet>

			<div className="ad-search" onClick={open}>
				<span className="ad-g" aria-hidden="true">
					⌕
				</span>
				<input
					placeholder="Buscar em todo o painel"
					readOnly
					aria-label="Buscar em todo o painel"
					onFocus={open}
				/>
				<span className="ad-kbd">⌘K</span>
			</div>

			<Link className="ad-site" href="/">
				Ver o site ↗
			</Link>
			<span className="ad-me">{initialsOf(user)}</span>
		</header>
	);
}
