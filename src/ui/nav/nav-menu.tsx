import { getTranslations } from "@/i18n/server";
import { PUBLIC_NAVIGATION } from "@/lib/public-navigation";
import { getStripeCategories } from "@/lib/stripe-categories";
import { NavMobileMenu } from "@/ui/nav/nav-mobile-menu.client";
import { YnsLink } from "@/ui/yns-link";

export const NavMenu = async () => {
	const t = await getTranslations("Selo");
	const dynamicCategories = await getStripeCategories();
	const desktopLinks = [
		{ label: t("nav.home"), href: PUBLIC_NAVIGATION.home },
		{ label: t("nav.shop"), href: PUBLIC_NAVIGATION.shop },
		{ label: t("nav.projects"), href: PUBLIC_NAVIGATION.projects },
		{ label: t("nav.events"), href: PUBLIC_NAVIGATION.events },
		{ label: t("nav.sarau"), href: PUBLIC_NAVIGATION.sarau },
		{ label: t("nav.about"), href: PUBLIC_NAVIGATION.about },
		{ label: t("nav.contact"), href: PUBLIC_NAVIGATION.contact },
	];
	const mobileLinks = [
		...desktopLinks,
		...dynamicCategories.slice(0, 3).map(({ name, slug }) => ({ label: name, href: `/category/${slug}` })),
	];
	return (
		<>
			<div className="hidden lg:block">
				<ul className="flex flex-row items-center justify-center gap-x-0.5">
					{desktopLinks.map((link) => (
						<li key={link.href}>
							<YnsLink
								href={link.href}
								className="nav-link group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-hidden xl:px-3"
							>
								{link.label}
							</YnsLink>
						</li>
					))}
				</ul>
			</div>
			<div className="flex items-center lg:hidden">
				<NavMobileMenu>
					<ul className="flex flex-col items-stretch justify-center gap-x-1 pb-8 text-2xl">
						{mobileLinks.map((link) => (
							<li key={link.href}>
								<YnsLink
									href={link.href}
									className="nav-link display-font group inline-flex h-9 w-full items-center justify-center rounded-md bg-transparent px-4 py-2 font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-hidden text-2xl"
								>
									{link.label}
								</YnsLink>
							</li>
						))}
					</ul>
				</NavMobileMenu>
			</div>
		</>
	);
};
