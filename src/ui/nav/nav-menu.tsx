import { getTranslations } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { isBackofficeRole } from "@/lib/authz";
import { PUBLIC_NAVIGATION } from "@/lib/public-navigation";
import { getStripeCategories } from "@/lib/stripe-categories";
import { NavMobileMenu } from "@/ui/nav/nav-mobile-menu.client";
import { YnsLink } from "@/ui/yns-link";

export const NavMenu = async () => {
	const session = await auth();
	const isAdminSession = isBackofficeRole(session?.user.role);
	const authHref = !session ? "/login" : isAdminSession ? "/admin" : "/user";
	const authLabel = !session ? "Entrar" : isAdminSession ? "Admin" : "Minha conta";
	const t = await getTranslations("Selo");
	const dynamicCategories = await getStripeCategories();
	const desktopLinks = [
		{ label: t("nav.shop"), href: PUBLIC_NAVIGATION.shop },
		{ label: t("nav.projects"), href: PUBLIC_NAVIGATION.projects },
		{ label: t("nav.events"), href: PUBLIC_NAVIGATION.events },
		{ label: t("nav.sarau"), href: PUBLIC_NAVIGATION.sarau },
		{ label: t("nav.about"), href: PUBLIC_NAVIGATION.about },
	];
	const mobileLinks = [
		{ label: t("nav.home"), href: PUBLIC_NAVIGATION.home },
		...desktopLinks,
		{ label: t("nav.contact"), href: PUBLIC_NAVIGATION.contact },
		...dynamicCategories.slice(0, 3).map(({ name, slug }) => ({ label: name, href: `/category/${slug}` })),
	];
	return (
		<>
			<div className="hidden lg:block">
				<ul className="flex flex-row items-center justify-end gap-x-10 xl:gap-x-12">
					{desktopLinks.map((link) => (
						<li key={link.href}>
							<YnsLink
								href={link.href}
								className="nav-link group inline-flex h-9 w-max items-center justify-center bg-transparent py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors hover:text-[color:var(--editorial-accent)] focus:text-[color:var(--editorial-accent)] focus:outline-hidden"
							>
								{link.label}
							</YnsLink>
						</li>
					))}
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
						<li className="pt-3">
							<YnsLink
								href={authHref}
								className="inline-flex h-12 items-center justify-center bg-[color:var(--editorial-ink)] px-2 w-10 text-sm font-black uppercase tracking-[0.18em] text-[color:var(--editorial-paper)]"
							>
								{authLabel}
							</YnsLink>
						</li>
					</ul>
				</NavMobileMenu>
			</div>
		</>
	);
};
