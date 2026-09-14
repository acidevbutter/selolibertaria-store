"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { useAdminRouteProgress } from "@/app/admin/_components/admin-route-progress.client";
import { adminNavGroups, type NavCounts, resolveNavState } from "@/app/admin/_components/nav-config";
import { hasCapability, type UserRole } from "@/lib/authz";

type SidebarUser = {
	name?: string | null;
	email?: string | null;
	role?: UserRole;
	capability?: string;
};

/**
 * The rail (ui_kit `.rail`, canvas 4b): 264px, shell ink, three groups, no icons.
 * One component for every admin screen — no per-page variation.
 */
export function AdminSidebar({ user, counts = {} }: { user?: SidebarUser; counts?: NavCounts }) {
	const pathname = usePathname();
	const { pendingHref, navigate } = useAdminRouteProgress();

	return (
		<nav className="ad-rail hidden md:flex">
			<div className="ad-lockup">
				<div className="ad-mark">
					<Image src="/images/selolibertaria.png" alt="" width={44} height={44} priority />
				</div>
				<div>
					<b>Libertária</b>
					<i>Painel editorial</i>
				</div>
			</div>

			{adminNavGroups.map((group) => {
				const visibleItems = group.items.filter((item) => hasCapability(user?.role, item.capability));
				if (visibleItems.length === 0) return null;

				return (
					<Fragment key={group.label}>
						<div className="ad-grp">{group.label}</div>
						{visibleItems.map((item) => {
							const state = resolveNavState(pathname, item.href);
							const selected = state === "selected";
							const count = item.countKey ? counts[item.countKey] : undefined;

							return (
								<button
									key={item.href}
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
									{typeof count === "number" ? <span className="ad-ct">{count}</span> : null}
								</button>
							);
						})}
					</Fragment>
				);
			})}

			<div className="ad-who">
				<b>
					{user?.name ?? user?.email ?? "Sessão"}
					{user?.role ? ` · ${user.role}` : ""}
				</b>
				<span>{user?.capability ?? "editorial.write"}</span>
			</div>
		</nav>
	);
}
