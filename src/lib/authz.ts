export type UserRole = "admin" | "vendor" | "customer";

export type Capability =
	| "admin.access"
	| "catalog.read"
	| "catalog.write"
	| "editorial.read"
	| "editorial.write"
	| "orders.read"
	| "orders.update_status"
	| "customers.read"
	| "promotions.read"
	| "promotions.write"
	| "presale.read"
	| "presale.write"
	| "settings.read"
	| "settings.write"
	| "webhooks.read"
	| "emails.read"
	| "staff.manage"
	| "selolibertaria.buy"
	| "account.self";

const ROLE_CAPABILITIES: Record<UserRole, readonly Capability[]> = {
	admin: [
		"admin.access",
		"catalog.read",
		"catalog.write",
		"editorial.read",
		"editorial.write",
		"orders.read",
		"orders.update_status",
		"customers.read",
		"promotions.read",
		"promotions.write",
		"presale.read",
		"presale.write",
		"settings.read",
		"settings.write",
		"webhooks.read",
		"emails.read",
		"staff.manage",
		"account.self",
	],
	vendor: [
		"admin.access",
		"catalog.read",
		"catalog.write",
		"editorial.read",
		"editorial.write",
		"orders.read",
		"orders.update_status",
		"customers.read",
		"promotions.read",
		"promotions.write",
		"account.self",
	],
	customer: ["selolibertaria.buy", "account.self"],
};

export function normalizeUserRole(role?: string | null): UserRole {
	if (role === "admin" || role === "vendor" || role === "customer") return role;
	return "customer";
}

export function getRoleCapabilities(role?: string | null): readonly Capability[] {
	return ROLE_CAPABILITIES[normalizeUserRole(role)];
}

export function hasCapability(role: string | null | undefined, capability: Capability): boolean {
	return getRoleCapabilities(role).includes(capability);
}

export function isInternalOperatorRole(role?: string | null): boolean {
	const normalized = normalizeUserRole(role);
	return normalized === "admin" || normalized === "vendor";
}

export function isBackofficeRole(role?: string | null): boolean {
	return hasCapability(role, "admin.access");
}

export function canBuyOnSelolibertaria(role?: string | null): boolean {
	return hasCapability(role, "selolibertaria.buy");
}

export function isUserBlocked(
	user?: { access?: { blockedAt?: Date | string | null } | null } | null,
): boolean {
	return Boolean(user?.access?.blockedAt);
}

// Compatibility alias for legacy importers that used a different casing
export const canBuyOnselolibertaria = canBuyOnSelolibertaria;
