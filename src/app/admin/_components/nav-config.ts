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
	{ href: "/admin", label: "Overview", icon: LayoutDashboard, capability: "admin.access" },
	{ href: "/admin/orders", label: "Orders", icon: ShoppingCart, capability: "orders.read" },
	{ href: "/admin/products", label: "Products", icon: Package, capability: "catalog.write" },
	{ href: "/admin/editorial", label: "Editorial", icon: BookOpen, capability: "editorial.write" },
	{ href: "/admin/promotions", label: "Promotions", icon: Percent, capability: "promotions.read" },
	{ href: "/admin/users", label: "Users", icon: Users, capability: "customers.read" },
	{ href: "/admin/emails", label: "Emails", icon: Mail, capability: "emails.read" },
	{ href: "/admin/settings", label: "Settings", icon: Settings, capability: "settings.write" },
	{ href: "/admin/email-templates", label: "Email Templates", icon: Settings, capability: "settings.write" },
	{ href: "/admin/webhooks", label: "Webhooks", icon: Activity, capability: "webhooks.read" },
];
