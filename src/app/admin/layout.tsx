import { IBM_Plex_Mono } from "next/font/google";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
	AdminRouteBar,
	AdminRouteProgressProvider,
} from "@/app/admin/_components/admin-route-progress.client";
import {
	AdminSearchPaletteProvider,
	type SearchEntry,
} from "@/app/admin/_components/admin-search-palette.client";
import { AdminThemeProvider } from "@/app/admin/_components/admin-theme-provider.client";
import { adminNavItems, type NavCounts } from "@/app/admin/_components/nav-config";
import { fetchMediaCount, fetchOrdersCount } from "@/app/admin/_components/nav-counts";
import { AdminSidebar } from "@/app/admin/_components/sidebar.client";
import { AdminTopbar } from "@/app/admin/_components/topbar.client";
import { auth, logout } from "@/lib/auth";
import { hasCapability, isBackofficeRole, normalizeUserRole } from "@/lib/authz";
import { listEditorialRecordsForAdmin } from "@/lib/editorial-content-store";
import { getSettingsDoc } from "@/lib/settings-store";
import "@/styles/ad-tokens.css";
import "@/styles/ad-oficina.css";

// Data face of the panel (§1.2): every id, date, money value, count, dimension,
// file name/size, keyboard shortcut and schema type name. DCC Ash is not loaded
// in the admin bundle.
const ibmPlexMono = IBM_Plex_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-ad-mono",
	display: "swap",
});

export const dynamic = "force-dynamic";

/** Editable static pages listed on /admin/editorial — the "Páginas" count. */
const EDITORIAL_STATIC_PAGE_COUNT = 9;

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const session = await auth();
	if (!session) redirect("/login");
	const role = normalizeUserRole(session.user.role);
	if (!isBackofficeRole(role)) redirect("/forbidden");

	let initialTheme: "light" | "dark" = "light";
	const settings = await getSettingsDoc();
	if (settings?.current?.theme === "dark" || settings?.current?.theme === "light") {
		initialTheme = settings.current.theme;
	}

	const canReadEditorial = hasCapability(role, "editorial.write");
	const [images, orders] = await Promise.all([
		hasCapability(role, "catalog.write") ? fetchMediaCount() : undefined,
		hasCapability(role, "orders.read") ? fetchOrdersCount() : undefined,
	]);
	const [events, projects] = canReadEditorial
		? await Promise.all([listEditorialRecordsForAdmin("event"), listEditorialRecordsForAdmin("project")])
		: [[], []];

	const counts: NavCounts = {
		...(canReadEditorial
			? { pages: EDITORIAL_STATIC_PAGE_COUNT, events: events.length, projects: projects.length }
			: {}),
		...(typeof images === "number" ? { images } : {}),
		...(typeof orders === "number" ? { orders } : {}),
	};

	const searchEntries: SearchEntry[] = [
		...events.map((event) => ({
			group: "Páginas e eventos",
			label: event.title ?? event.slug,
			href: `/admin/editorial/events`,
			meta: event.published ? "publicado" : "rascunho",
		})),
		...projects.map((project) => ({
			group: "Páginas e eventos",
			label: project.title ?? project.slug,
			href: `/admin/editorial/projects/${project.slug}`,
			meta: project.published ? "publicado" : "rascunho",
		})),
		...adminNavItems
			.filter((item) => hasCapability(role, item.capability))
			.map((item) => ({ group: "Ir para", label: item.label, href: item.href })),
	];

	return (
		<AdminThemeProvider initialTheme={initialTheme}>
			<AdminRouteProgressProvider>
				{/* Three surfaces, never a fourth: shell (rail, topbar) → desk → sheet. */}
				<div className={`ad-root ${ibmPlexMono.variable}`}>
					<AdminSearchPaletteProvider entries={searchEntries}>
						<div className="ad-app">
							<AdminSidebar
								user={{ name: session.user.name, email: session.user.email, role }}
								counts={counts}
							/>
							<div className="ad-col">
								<AdminTopbar
									role={role}
									user={{ name: session.user.name, email: session.user.email }}
									logoutAction={logout}
								/>
								<AdminRouteBar />
								<main className="ad-desk">{children}</main>
							</div>
						</div>
					</AdminSearchPaletteProvider>
				</div>
			</AdminRouteProgressProvider>
		</AdminThemeProvider>
	);
}
