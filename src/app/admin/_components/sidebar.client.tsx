"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
export function AdminSidebar({
	user,
	counts = {},
	logoutAction,
}: {
	user?: SidebarUser;
	counts?: NavCounts;
	logoutAction: () => Promise<void>;
}) {
	const pathname = usePathname();
	const { pendingHref, navigate } = useAdminRouteProgress();

	const visibleGroups = adminNavGroups
		.map((group) => ({
			...group,
			items: group.items.filter((item) => hasCapability(user?.role, item.capability)),
		}))
		.filter((group) => group.items.length > 0);

	const activeGroupLabel =
		visibleGroups.find((group) => group.items.some((item) => resolveNavState(pathname, item.href) !== "idle"))
			?.label ??
		visibleGroups[0]?.label ??
		null;

	const [openGroup, setOpenGroup] = useState<string | null>(activeGroupLabel);

	useEffect(() => {
		setOpenGroup(activeGroupLabel);
	}, [activeGroupLabel]);

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

			<div className="ad-rail-groups">
				{visibleGroups.map((group) => (
					<details
						key={group.label}
						name="ad-nav-group"
						open={openGroup === group.label}
						onToggle={(event) => {
							if (event.currentTarget.open) setOpenGroup(group.label);
						}}
					>
						<summary className="ad-grp">
							{group.label}
							<span className="ad-chev" aria-hidden="true">
								›
							</span>
						</summary>
						{group.items.map((item) => {
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
					</details>
				))}
			</div>

			<div className="ad-who">
				<b>
					{user?.name ?? user?.email ?? "Sessão"}
					{user?.role ? ` · ${user.role}` : ""}
				</b>
				<span>{user?.capability ?? "editorial.write"}</span>
				<form action={logoutAction}>
					<button type="submit" className="ad-mono ad-who-logout">
						sair
					</button>
				</form>
			</div>
		</nav>
	);
}
