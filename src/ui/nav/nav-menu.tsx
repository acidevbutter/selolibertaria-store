import { getTranslations } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { isBackofficeRole } from "@/lib/authz";
import { PUBLIC_NAVIGATION } from "@/lib/public-navigation";
import { NavMobileMenu } from "@/ui/nav/nav-mobile-menu.client";
import { YnsLink } from "@/ui/yns-link";

type NavMenuProps = {
	includeDynamicCategories?: boolean;
	includeSessionLink?: boolean;
};

export const NavMenu = async ({
	includeDynamicCategories: _includeDynamicCategories = true,
	includeSessionLink = true,
}: NavMenuProps = {}) => {
	const session = includeSessionLink ? await auth() : null;
	const globalT = await getTranslations("Global.nav.auth");
	const isAdminSession = isBackofficeRole(session?.user.role);
	const authHref = !session ? "/login" : isAdminSession ? "/admin" : "/user";
	const authLabel = !session ? globalT("signIn") : isAdminSession ? globalT("admin") : globalT("myAccount");
	const t = await getTranslations("Selo");
	const desktopLinks = [
		{ label: t("nav.shop"), href: PUBLIC_NAVIGATION.shop },
		{ label: t("nav.projects"), href: PUBLIC_NAVIGATION.projects },
		{ label: t("nav.sarau"), href: PUBLIC_NAVIGATION.sarau },
		{ label: t("nav.about"), href: PUBLIC_NAVIGATION.about },
		{ label: t("nav.contact"), href: PUBLIC_NAVIGATION.contact },
	];
	const mobileLinks = desktopLinks;
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
					{includeSessionLink ? (
						<li>
							<YnsLink
								href={authHref}
								className="inline-flex h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
							>
								{authLabel}
							</YnsLink>
						</li>
					) : null}
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
									className="inline-flex h-12 w-full items-center justify-center border border-[color:var(--editorial-border)] px-4 text-sm font-black uppercase tracking-[0.18em] text-[color:var(--editorial-ink)]"
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
