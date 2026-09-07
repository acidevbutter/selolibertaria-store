import "@/app/globals.css";
import { CartMergeOnAuth } from "@/components/cart-merge-on-auth.client";
import { MobileFloatingCart } from "@/components/mobile-floating-cart";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getPreSalePopupCampaign } from "@/lib/pre-sale.server";
import { Footer } from "@/ui/footer/footer";
import { accountToWebsiteJsonLd, JsonLd } from "@/ui/json-ld";
import { Nav } from "@/ui/nav/nav";
import { PreSaleCountdownPopup } from "@/ui/pre-venda/pre-sale-countdown-popup.client";

export default async function StoreLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const preSalePopupCampaign = await getPreSalePopupCampaign();

	return (
		<>
			<CartMergeOnAuth />
			<Nav />
			<TooltipProvider>
				<main className="flex w-full flex-1 flex-col">{children}</main>
				<MobileFloatingCart />
				<Footer />
				{preSalePopupCampaign ? <PreSaleCountdownPopup campaign={preSalePopupCampaign} /> : null}
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
