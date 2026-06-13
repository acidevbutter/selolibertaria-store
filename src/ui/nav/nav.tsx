import { UserIcon } from "lucide-react";
import Image from "next/image";
import { CartIcon } from "@/components/cart-icon";
import { auth } from "@/lib/auth";
import { isBackofficeRole } from "@/lib/authz";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { HomeTopBar } from "@/ui/home/home-top-bar";
import { NavMenu } from "@/ui/nav/nav-menu";
import { SearchNav } from "@/ui/nav/search-nav";
// import ThemeToggle from "@/ui/theme-toggle.client";
import { YnsLink } from "@/ui/yns-link";

export const Nav = async () => {
	const session = await auth();
	return (
		<header className="sticky top-0 z-50 border-b border-border/60 bg-background/92 backdrop-blur-xs nav-border-reveal">
			<HomeTopBar />
			<div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
				<YnsLink
					href="/"
					className="flex min-w-0 shrink-0 items-center gap-3 lg:max-w-[17rem] xl:max-w-[19rem]"
				>
					<Image
						src="/images/selolibertaria.png"
						alt={`${seloSiteMeta.name} mark`}
						width={48}
						height={48}
						className="h-12 w-12 object-contain"
					/>
					<span className="min-w-0">
						<span className="editorial-serif block truncate text-lg font-semibold tracking-tight text-foreground">
							{seloSiteMeta.name}
						</span>
						<span className="hidden text-xs text-muted-foreground xl:block">{seloSiteMeta.tagline}</span>
					</span>
				</YnsLink>

				<div className="min-w-0 flex-1 lg:flex lg:justify-center">
					<NavMenu />
				</div>

				<div className="ml-auto hidden min-w-0 lg:block lg:w-full lg:max-w-[11rem] xl:max-w-[14rem]">
					<SearchNav />
				</div>
				<div className="ml-auto lg:hidden">
					<SearchNav />
				</div>
				{!isBackofficeRole(session?.user.role) ? <CartIcon /> : null}
				<div className="mx-1">{/* <ThemeToggle /> */}</div>
				{isBackofficeRole(session?.user.role) && (
					<YnsLink href="/admin" className="mr-1 text-sm font-medium hover:underline">
						Admin
					</YnsLink>
				)}
				<YnsLink href={session ? "/user" : "/login"}>
					<UserIcon className="hover:text-red-700" />
				</YnsLink>
			</div>
		</header>
	);
};
