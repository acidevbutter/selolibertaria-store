export const PUBLIC_NAVIGATION = {
	home: "/",
	shop: "/products",
	projects: "/projects",
	events: "/events",
	sarau: "/sarau-safado",
	about: "/about",
	contact: "/contact",
	faq: "/faq",
	terms: "/terms",
	privacy: "/privacy",
} as const;

export type PublicNavigationKey = keyof typeof PUBLIC_NAVIGATION;
