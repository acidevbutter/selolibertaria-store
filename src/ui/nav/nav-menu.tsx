import { getTranslations } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { isBackofficeRole } from "@/lib/authz";
import { PUBLIC_NAVIGATION } from "@/lib/public-navigation";
import { getStripeCategories } from "@/lib/stripe-categories";
import { NavMobileMenu } from "@/ui/nav/nav-mobile-menu.client";
import { YnsLink } from "@/ui/yns-link";

type NavMenuProps = {
	includeDynamicCategories?: boolean;
	includeSessionLink?: boolean;
};

export const NavMenu = async ({
	includeDynamicCategories = true,
	includeSessionLink = true,
}: NavMenuProps = {}) => {
	const session = includeSessionLink ? await auth() : null;
	const globalT = await getTranslations("Global.nav.auth");
	const isAdminSession = isBackofficeRole(session?.user.role);
	const authHref = !session ? "/login" : isAdminSession ? "/admin" : "/user";
	const authLabel = !session ? globalT("signIn") : isAdminSession ? globalT("admin") : globalT("myAccount");
	const t = await getTranslations("Selo");
	const dynamicCategories = includeDynamicCategories ? await getStripeCategories() : [];
	const desktopLinks = [
		{ label: t("nav.shop"), href: PUBLIC_NAVIGATION.shop },
		{ label: t("nav.projects"), href: PUBLIC_NAVIGATION.projects },
		{ label: t("nav.sarau"), href: PUBLIC_NAVIGATION.sarau },
		{ label: t("nav.about"), href: PUBLIC_NAVIGATION.about },
		{ label: t("nav.contact"), href: PUBLIC_NAVIGATION.contact },
	];
	const mobileLinks = [
		{ label: t("nav.home"), href: PUBLIC_NAVIGATION.home },
		...desktopLinks.slice(0, 2),
		{ label: t("nav.events"), href: PUBLIC_NAVIGATION.events },
		...desktopLinks.slice(2),
		...dynamicCategories.slice(0, 3).map(({ name, slug }) => ({ label: name, href: `/category/${slug}` })),
	];
	return (
		<>
			<div className="hidden lg:block">
				<ul className="flex flex-row items-center justify-end gap-x-7 xl:gap-x-9">
					{desktopLinks.map((link) => (
						<li key={link.href}>
							<YnsLink
								href={link.href}
								className="nav-link group inline-flex h-9 w-max items-center justify-center bg-transparent py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--editorial-ink)] transition-colors hover:text-[color:var(--editorial-accent)] focus:text-[color:var(--editorial-accent)] focus:outline-hidden"
							>
								{link.label}
							</YnsLink>
						</li>
					))}
					<li>
						<YnsLink
							href={PUBLIC_NAVIGATION.shop}
							className="inline-flex h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
						>
							Comprar
						</YnsLink>
					</li>
				</ul>
			</div>
			<div className="flex items-center lg:hidden">
				<NavMobileMenu>
					<ul className="flex flex-col items-stretch justify-center gap-2 pb-8 text-2xl">
						{mobileLinks.map((link) => (
							<li key={link.href}>
								<YnsLink
									href={link.href}
									className="nav-link group inline-flex w-full items-center justify-start border-b border-[color:var(--editorial-border)] px-0 py-3 text-xl font-black uppercase tracking-[0.08em] text-[color:var(--editorial-ink)] transition-colors hover:text-[color:var(--editorial-accent)] focus:text-[color:var(--editorial-accent)] focus:outline-hidden"
								>
									{link.label}
								</YnsLink>
							</li>
						))}
						{includeSessionLink ? (
							<li className="pt-3">
								<YnsLink
									href={authHref}
									className="inline-flex h-12 items-center justify-center bg-[color:var(--editorial-ink)] px-2 w-10 text-sm font-black uppercase tracking-[0.18em] text-[color:var(--editorial-paper)]"
								>
									{authLabel}
								</YnsLink>
							</li>
						) : null}
					</ul>
				</NavMobileMenu>
			</div>
		</>
	);
};
