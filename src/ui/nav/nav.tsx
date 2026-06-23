import { UserIcon } from "lucide-react";
import { CartIcon } from "@/components/cart-icon";
import { getTranslations } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { isBackofficeRole } from "@/lib/authz";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { NavMenu } from "@/ui/nav/nav-menu";
// import ThemeToggle from "@/ui/theme-toggle.client";
import { YnsLink } from "@/ui/yns-link";

type NavProps = {
	hideAuthCta?: boolean;
	lightweight?: boolean;
};

export const Nav = async ({ hideAuthCta = false, lightweight = false }: NavProps = {}) => {
	const session = hideAuthCta || lightweight ? null : await auth();
	const t = await getTranslations("Global.nav.auth");
	const isAdminSession = isBackofficeRole(session?.user.role);
	const authHref = !session ? "/login" : isAdminSession ? "/admin" : "/user";
	const authLabel = !session ? t("signIn") : isAdminSession ? t("admin") : t("myAccount");
	return (
		<header className="sticky top-0 z-50 bg-[color:rgba(247,244,239,0.98)] backdrop-blur-xs">
			<div className="w-full bg-[color:var(--editorial-paper)] px-4 pt-5 sm:px-8 sm:pt-5 lg:px-12">
				<div className="flex items-center justify-between gap-6 pb-5">
					<YnsLink
						href="/"
						className="min-w-0 shrink-0 text-base font-black uppercase tracking-[0.18em] text-[color:var(--editorial-ink)]"
					>
						{seloSiteMeta.name}
					</YnsLink>

					<div className="flex items-center gap-5">
						<div className="min-w-0 flex-1 lg:flex lg:justify-end">
							<NavMenu
								includeDynamicCategories={!lightweight}
								includeSessionLink={!hideAuthCta && !lightweight}
							/>
						</div>
						{hideAuthCta ? null : (
							<>
								<div className="flex items-center gap-2 lg:hidden">
									{!isAdminSession ? <CartIcon /> : null}
									<YnsLink
										href={authHref}
										className="inline-flex h-9 w-9 items-center justify-center border border-[color:var(--editorial-ink)] text-[color:var(--editorial-ink)]"
									>
										<UserIcon className="h-4 w-4" />
									</YnsLink>
								</div>
								<YnsLink
									href={authHref}
									className="hidden h-12 w-25 items-center justify-center bg-[color:var(--editorial-ink)] px-3 text-[11px] font-black uppercase leading-[1.05] tracking-[0.2em] text-[color:var(--editorial-paper)] lg:inline-flex"
								>
									<span className="block text-center">
										{!session && authLabel === t("signIn") ? (
											<>{authLabel}</>
										) : !session || isAdminSession ? (
											<>{authLabel}</>
										) : (
											<>
												{t("my")}
												<br />
												{t("account")}
											</>
										)}
									</span>
								</YnsLink>
							</>
						)}
					</div>
				</div>
				<div className="border-b-2 border-[color:var(--editorial-ink)]" />
			</div>
		</header>
	);
};
