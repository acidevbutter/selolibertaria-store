import { UserIcon } from "lucide-react";
import { CartIcon } from "@/components/cart-icon";
import { auth } from "@/lib/auth";
import { isBackofficeRole } from "@/lib/authz";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { NavMenu } from "@/ui/nav/nav-menu";
// import ThemeToggle from "@/ui/theme-toggle.client";
import { YnsLink } from "@/ui/yns-link";

export const Nav = async () => {
	const session = await auth();
	return (
		<header className="sticky top-0 z-50 border-b border-[color:var(--editorial-ink)] bg-[color:rgba(247,244,239,0.96)] backdrop-blur-xs">
			<div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
				<YnsLink
					href="/"
					className="min-w-0 shrink-0 text-sm font-black uppercase tracking-[0.14em] text-[color:var(--editorial-ink)]"
				>
					{seloSiteMeta.name}
				</YnsLink>

				<div className="min-w-0 flex-1 lg:flex lg:justify-end">
					<NavMenu />
				</div>
				<div className="flex items-center gap-2">
					{!isBackofficeRole(session?.user.role) ? <CartIcon /> : null}
					{isBackofficeRole(session?.user.role) && (
						<YnsLink href="/admin" className="text-xs font-bold uppercase tracking-[0.14em] hover:underline">
							Admin
						</YnsLink>
					)}
					<YnsLink
						href={session ? "/user" : "/login"}
						className="inline-flex h-9 w-9 items-center justify-center border border-[color:var(--editorial-ink)] text-[color:var(--editorial-ink)] transition-colors hover:bg-[color:var(--editorial-ink)] hover:text-[color:var(--editorial-paper)]"
					>
						<UserIcon className="h-4 w-4" />
					</YnsLink>
					<YnsLink
						href="/products"
						className="hidden h-10 items-center justify-center bg-[color:var(--editorial-ink)] px-4 text-xs font-black uppercase tracking-[0.18em] text-[color:var(--editorial-paper)] lg:inline-flex"
					>
						Comprar
					</YnsLink>
				</div>
			</div>
		</header>
	);
};
