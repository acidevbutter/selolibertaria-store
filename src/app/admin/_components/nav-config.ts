import {
	Activity,
	BookOpen,
	LayoutDashboard,
	Mail,
	Package,
	Percent,
	Settings,
	ShoppingCart,
	Users,
} from "lucide-react";
import type { Capability } from "@/lib/authz";

export type NavItem = {
	href: string;
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
	capability: Capability;
};

export const adminNavItems: NavItem[] = [
	{ href: "/admin", label: "Painel", icon: LayoutDashboard, capability: "admin.access" },
	{ href: "/admin/orders", label: "Pedidos", icon: ShoppingCart, capability: "orders.read" },
	{ href: "/admin/products", label: "Livros", icon: Package, capability: "catalog.write" },
	{ href: "/admin/editorial", label: "Editorial", icon: BookOpen, capability: "editorial.write" },
	{ href: "/admin/promotions", label: "Promoções", icon: Percent, capability: "promotions.read" },
	{ href: "/admin/users", label: "Usuários", icon: Users, capability: "customers.read" },
	{ href: "/admin/emails", label: "E-mails", icon: Mail, capability: "emails.read" },
	{ href: "/admin/settings", label: "Configurações", icon: Settings, capability: "settings.write" },
	{ href: "/admin/email-templates", label: "Modelos de e-mail", icon: Settings, capability: "settings.write" },
	{ href: "/admin/webhooks", label: "Recebimento", icon: Activity, capability: "webhooks.read" },
];
