import "@/app/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Suspense } from "react";
import { getCartAction } from "@/actions/cart-actions";
import { CheckoutSuccessHandler } from "@/components/checkout-success-handler.client";
import { CredentialSaveOnAuth } from "@/components/credential-save-on-auth.client";
import ThemeProviderWrapper from "@/components/theme-provider.client";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/context/cart-context";
import { env, publicUrl } from "@/env.mjs";
import { IntlClientProvider } from "@/i18n/client";
import { getMessages } from "@/i18n/server";
import { seloSiteMeta } from "@/lib/selolibertaria-content";

// Fertigo Pro — main headings (h1/h2) + body. Also the fallback for DCCAsh's
// missing PT-BR accented glyphs (see src/styles/sl-tokens.css @font-face).
const fertigoPro = localFont({
	src: "../../public/fonts/FertigoPro-Regular.otf",
	variable: "--font-editorial-body",
	display: "swap",
});

const shouldLoadVercelClientTelemetry =
	process.env.NODE_ENV === "production" &&
	(Boolean(process.env.VERCEL) || Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV));

export const generateMetadata = async (): Promise<Metadata> => {
	return {
		title: seloSiteMeta.title,
		description: seloSiteMeta.description,
		metadataBase: new URL(publicUrl),
		icons: {
			icon: [{ url: "/images/selolibertaria.png", type: "image/png", sizes: "512x512" }],
			shortcut: ["/images/selolibertaria.png"],
			apple: [{ url: "/images/selolibertaria.png", sizes: "512x512", type: "image/png" }],
		},
	};
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const [messages, initialCart] = await Promise.all([getMessages(), getCartAction()]);

	return (
		<html lang="pt-BR" suppressHydrationWarning className={`h-full antialiased ${fertigoPro.variable}`}>
			<body className="display-font flex min-h-full flex-col bg-background text-foreground">
				<ThemeProviderWrapper>
					<IntlClientProvider messages={messages} locale="pt-BR">
						<Suspense fallback={null}>
							<CartProvider initialCart={initialCart}>
								<Suspense fallback={null}>
									<CheckoutSuccessHandler />
								</Suspense>
								<CredentialSaveOnAuth />
								<div className="flex min-h-full flex-1 flex-col" vaul-drawer-wrapper="">
									{children}
								</div>
								<Toaster position="top-center" offset={10} />
							</CartProvider>
						</Suspense>
					</IntlClientProvider>
				</ThemeProviderWrapper>
				{env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
					<Script
						async
						src="/stats/script.js"
						data-host-url={publicUrl + "/stats"}
						data-website-id={env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
					/>
				)}
				{shouldLoadVercelClientTelemetry ? <SpeedInsights /> : null}
				{shouldLoadVercelClientTelemetry ? <Analytics /> : null}
			</body>
		</html>
	);
}
