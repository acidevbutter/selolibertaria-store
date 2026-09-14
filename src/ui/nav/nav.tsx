import { Suspense } from "react";
import { CartIcon } from "@/components/cart-icon";
import { CartSidebarHost } from "@/components/cart-sidebar-host";
import { getTranslations } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { isBackofficeRole } from "@/lib/authz";
import { PUBLIC_NAVIGATION } from "@/lib/public-navigation";
import { cn } from "@/lib/utils";
import { NavMobileMenu } from "@/ui/nav/nav-mobile-menu.client";
import { SearchInput, SearchInputPlaceholder } from "@/ui/nav/search-input.client";
import { type SlNavLink, SlNavLinks } from "@/ui/nav/sl-nav.client";
import { YnsLink } from "@/ui/yns-link";

type NavProps = {
	hideAuthCta?: boolean;
	lightweight?: boolean;
};

const SL_SEARCH_CLASS =
	"h-11 w-[200px] rounded-none border border-[color:var(--sl-line-on-ink)] bg-transparent px-3.5 text-[13px] text-[color:var(--sl-text-on-ink)] outline-none placeholder:text-[color:var(--sl-text-on-ink-soft)] focus-visible:ring-0";

/** SL SiteHeader — ink header for the whole public site. Wine cart is the only colour block. */
export const Nav = async ({ hideAuthCta = false, lightweight = false }: NavProps = {}) => {
	const session = hideAuthCta || lightweight ? null : await auth();
	const isAdminSession = isBackofficeRole(session?.user.role);
	const authHref = !session ? "/login" : isAdminSession ? "/admin" : "/user";
	const [navT, searchT, authT] = await Promise.all([
		getTranslations("Selo"),
		getTranslations("Global.nav.search"),
		getTranslations("Global.nav.auth"),
	]);
	const authLabel = !session ? authT("signIn") : isAdminSession ? authT("admin") : authT("myAccount");

	const links: SlNavLink[] = [
		{ label: navT("nav.shop"), href: PUBLIC_NAVIGATION.shop },
		{ label: navT("nav.sarau"), href: PUBLIC_NAVIGATION.sarau },
		{ label: navT("nav.projects"), href: PUBLIC_NAVIGATION.projects },
		{ label: navT("nav.about"), href: PUBLIC_NAVIGATION.about },
		{ label: navT("nav.contact"), href: PUBLIC_NAVIGATION.contact },
	];

	return (
		<header
			className="sl-scope sticky top-0 z-50"
			style={{ background: "var(--sl-ink)", color: "var(--sl-text-on-ink)" }}
		>
			<div className="mx-auto flex h-[var(--sl-h-header)] w-full max-w-[var(--sl-w-desktop)] items-center justify-between gap-6 px-4 sm:px-8 lg:px-12">
				<YnsLink href="/" className="flex shrink-0 items-center gap-3.5">
					<span className="block h-10 w-10 shrink-0 overflow-hidden">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src="/images/selolibertaria.png"
							alt="Selo Libertária"
							className="h-full w-full object-cover"
						/>
					</span>
					<span className="hidden flex-col leading-none sm:flex">
						<span className="sl-u text-[10px] tracking-[0.34em] text-[color:var(--sl-text-on-ink-label)]">
							Selo
						</span>
						<span className="sl-u text-[15px] tracking-[0.28em]">Libertária</span>
					</span>
				</YnsLink>

				<SlNavLinks links={links} />

				<div className="flex items-center gap-2.5">
					<label className="hidden items-center md:flex">
						<span className="sr-only">{searchT("title")}</span>
						<Suspense
							fallback={
								<SearchInputPlaceholder placeholder={searchT("placeholder")} className={SL_SEARCH_CLASS} />
							}
						>
							<SearchInput placeholder={searchT("placeholder")} className={SL_SEARCH_CLASS} />
						</Suspense>
					</label>

					{hideAuthCta ? null : (
						<YnsLink
							href={authHref}
							className={cn(
								"hidden text-[11px] font-black uppercase tracking-[0.2em] transition-colors lg:inline",
								isAdminSession
									? "sl-link"
									: "text-[color:var(--sl-text-on-ink-soft)] hover:text-[color:var(--sl-text-on-ink)]",
							)}
						>
							{authLabel}
						</YnsLink>
					)}

					{!isAdminSession && !hideAuthCta ? <CartIcon /> : null}

					<div className="lg:hidden" style={{ color: "var(--sl-text-on-ink)" }}>
						<NavMobileMenu>
							<ul className="m-0 flex list-none flex-col gap-1 p-0 pb-8">
								{links.map((link) => (
									<li key={link.href}>
										<YnsLink
											href={link.href}
											className="block border-b border-[color:var(--sl-line-hairline)] py-3 text-[18px] font-black uppercase tracking-[0.08em] text-[color:var(--sl-text)]"
										>
											{link.label}
										</YnsLink>
									</li>
								))}
								{hideAuthCta ? null : (
									<li className="pt-3">
										<YnsLink href={authHref} className="sl-btn sl-btn-secondary w-full">
											{authLabel}
										</YnsLink>
									</li>
								)}
							</ul>
						</NavMobileMenu>
					</div>
				</div>
			</div>
			{!hideAuthCta && !isAdminSession ? <CartSidebarHost /> : null}
		</header>
	);
};
