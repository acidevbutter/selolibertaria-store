import type { Capability } from "@/lib/authz";

/**
 * Oficina v2 rail (fatia 05.2, canvas 4b). Three groups, closed list, no icons.
 * Renames fixed by the spec: Editorial → Páginas, Usuários → Clientes,
 * Recebimento → Pagamentos recebidos. Eventos and Projetos are top-level items,
 * not a third level under Páginas.
 */

export type NavItem = {
	href: string;
	label: string;
	capability: Capability;
	/** Key of the count rendered on the right in mono 11, when the shell resolves one. */
	countKey?: NavCountKey;
};

export type NavCountKey = "pages" | "events" | "projects" | "images" | "orders";

export type NavGroup = {
	label: string;
	items: NavItem[];
};

export const adminNavGroups: NavGroup[] = [
	{
		label: "Conteúdo",
		items: [
			{ href: "/admin/editorial", label: "Páginas", capability: "editorial.write", countKey: "pages" },
			{
				href: "/admin/editorial/events",
				label: "Eventos",
				capability: "editorial.write",
				countKey: "events",
			},
			{
				href: "/admin/editorial/projects",
				label: "Projetos",
				capability: "editorial.write",
				countKey: "projects",
			},
			{ href: "/admin/media", label: "Imagens", capability: "catalog.write", countKey: "images" },
		],
	},
	{
		label: "Operação",
		items: [
			{ href: "/admin/orders", label: "Pedidos", capability: "orders.read", countKey: "orders" },
			{ href: "/admin/products", label: "Produtos", capability: "catalog.write" },
			{ href: "/admin/promotions", label: "Promoções", capability: "promotions.read" },
			{ href: "/admin/pre-venda", label: "Pré-vendas", capability: "presale.read" },
			{ href: "/admin/users", label: "Clientes", capability: "customers.read" },
		],
	},
	{
		label: "Sistema",
		items: [
			{ href: "/admin/emails", label: "E-mails enviados", capability: "emails.read" },
			{ href: "/admin/email-templates", label: "Modelos de e-mail", capability: "settings.write" },
			{ href: "/admin/webhooks", label: "Pagamentos recebidos", capability: "webhooks.read" },
			{ href: "/admin/settings", label: "Configurações", capability: "settings.write" },
		],
	},
];

/** Flat view, kept for callers that only need the routes (breadcrumb, mobile sheet). */
export const adminNavItems: NavItem[] = adminNavGroups.flatMap((group) => group.items);

export type NavCounts = Partial<Record<NavCountKey, number>>;

/**
 * Selection rule (§2): the subroute lights its own item, never the group.
 * `/admin/editorial/events/14` selects Eventos and leaves Páginas — the route
 * parent — on the weak hover wash so you can see where you came from.
 */
export function resolveNavState(pathname: string | null, href: string): "selected" | "parent" | "idle" {
	if (!pathname) return "idle";
	const selectedHref = adminNavItems
		.filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
		.reduce<string | null>(
			(best, item) => (best && best.length >= item.href.length ? best : item.href),
			null,
		);

	if (href === selectedHref) return "selected";
	if (selectedHref?.startsWith(`${href}/`)) return "parent";
	return "idle";
}
