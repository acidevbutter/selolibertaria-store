import "@/app/globals.css";
import { CartMergeOnAuth } from "@/components/cart-merge-on-auth.client";
import { MobileFloatingCart } from "@/components/mobile-floating-cart";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LITTLE_FISH_BIG_FISH_PRODUCT_ID, LITTLE_FISH_BIG_FISH_SLUG } from "@/lib/presales";
import { getPublicPresaleByProduct } from "@/lib/presales.server";
import { Footer } from "@/ui/footer/footer";
import { accountToWebsiteJsonLd, JsonLd } from "@/ui/json-ld";
import { Nav } from "@/ui/nav/nav";
import { NavVisibilityGate } from "@/ui/nav/nav-visibility-gate.client";
import { PresaleModal } from "@/ui/pre-venda/presale-modal.client";

export default async function StoreLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const presale = await getPublicPresaleByProduct(LITTLE_FISH_BIG_FISH_PRODUCT_ID);
	const navElement = await Nav();

	return (
		<>
			<CartMergeOnAuth />
			<NavVisibilityGate>{navElement}</NavVisibilityGate>
			<TooltipProvider>
				<main className="flex w-full flex-1 flex-col">{children}</main>
				<MobileFloatingCart />
				<Footer />
				{presale ? (
					<PresaleModal presale={presale} buyHref={`/product/${LITTLE_FISH_BIG_FISH_SLUG}`} />
				) : null}
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
