import "@/app/globals.css";
import { CartMergeOnAuth } from "@/components/cart-merge-on-auth.client";
import { MobileFloatingCart } from "@/components/mobile-floating-cart";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Footer } from "@/ui/footer/footer";
import { accountToWebsiteJsonLd, JsonLd } from "@/ui/json-ld";
import { Nav } from "@/ui/nav/nav";
import NavScroll from "@/ui/nav/nav-scroll.client";

export default async function StoreLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Note: accountGet and fileGet not available in new SDK

	return (
		<>
			<CartMergeOnAuth />
			<Nav />
			<NavScroll />
			<TooltipProvider>
				<main className="flex w-full flex-1 flex-col">{children}</main>
				<MobileFloatingCart />
				<Footer />
			</TooltipProvider>
			<JsonLd
				jsonLd={accountToWebsiteJsonLd({
					account: null,
					logoUrl: null,
				})}
			/>
		</>
	);
}
