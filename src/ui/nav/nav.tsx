import { UserIcon } from "lucide-react";
import Image from "next/image";
import { CartIcon } from "@/components/cart-icon";
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
	const isAdminSession = isBackofficeRole(session?.user.role);
	const authHref = !session ? "/login" : isAdminSession ? "/admin" : "/user";
	return (
		<header className="sticky top-0 z-50 bg-[color:rgba(247,244,239,0.98)] backdrop-blur-xs">
			<div className="w-full bg-[color:var(--editorial-paper)] px-4 pt-5 sm:px-8 lg:px-12">
				<div className="flex items-center justify-between gap-6 pb-5">
					<YnsLink
						href="/"
						className="flex min-w-0 shrink-0 items-center gap-3 text-[color:var(--editorial-ink)]"
					>
						<div className="relative h-11 w-11 shrink-0 overflow-hidden border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)]">
							<Image
								src="/images/selolibertaria.png"
								alt={seloSiteMeta.name}
								fill
								className="object-cover"
								sizes="44px"
							/>
						</div>
						<div className="min-w-0">
							<div className="text-[0.7rem] font-black uppercase tracking-[0.34em] text-[color:var(--editorial-ink)]">
								Selo
							</div>
							<div className="text-sm font-black uppercase tracking-[0.28em] text-[color:var(--editorial-ink)] sm:text-base">
								Libertaria
							</div>
						</div>
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
							</>
						)}
					</div>
				</div>
				<div className="border-b border-[color:var(--editorial-ink)]" />
			</div>
		</header>
	);
};
