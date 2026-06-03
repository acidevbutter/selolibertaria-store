import { UserIcon } from "lucide-react";
import Image from "next/image";
import { CartIcon } from "@/components/cart-icon";
import { auth } from "@/lib/auth";
import { isBackofficeRole } from "@/lib/authz";
import { NavMenu } from "@/ui/nav/nav-menu";
import { SearchNav } from "@/ui/nav/search-nav";
// import ThemeToggle from "@/ui/theme-toggle.client";
import { YnsLink } from "@/ui/yns-link";

export const Nav = async () => {
	const session = await auth();
	const logoSize: number = 80;
	return (
		<header className="z-50 py-4 sticky top-0 bg-background/90 backdrop-blur-xs nav-border-reveal">
			<div className="mx-auto flex max-w-7xl items-center gap-2 px-4 flex-row sm:px-6 lg:px-8">
				<YnsLink href="/" className="flex items-center">
					<Image
						src="/images/ratoeira/ratoeira-red.svg"
						alt="Ratoeira77"
						width={logoSize}
						height={logoSize}
						className="-mt-0.5"
						priority
					/>
				</YnsLink>

				<div className="max-w-full flex shrink w-auto sm:mr-auto overflow-auto max-sm:order-2">
					<NavMenu />
				</div>
				<div className="mr-3 ml-auto sm:ml-0">
					<SearchNav />
				</div>
				{!isBackofficeRole(session?.user.role) ? <CartIcon /> : null}
				<div className="ml-2 mr-2">{/* <ThemeToggle /> */}</div>
				{isBackofficeRole(session?.user.role) && (
					<YnsLink href="/admin" className="mr-2 text-sm font-medium hover:underline">
						Admin
					</YnsLink>
				)}
				<YnsLink href={session ? "/user" : "/login"}>
					{/* make user icon turn project red on hover instead of grey */}
					<UserIcon className="hover:text-red-700" />
				</YnsLink>
			</div>
		</header>
	);
};
