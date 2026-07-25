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

const dccAsh = localFont({
	src: "../../public/fonts/DCC - Ash.otf",
	variable: "--font-editorial-display",
	display: "swap",
});

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
		<html
			lang="pt-BR"
			suppressHydrationWarning
			className={`h-full antialiased ${dccAsh.variable} ${fertigoPro.variable}`}
		>
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
				<Script
					id="dd-rum-sync"
					src="https://www.datadoghq-browser-agent.com/us5/v6/datadog-rum.js"
					type="text/javascript"
					strategy="beforeInteractive"
				/>
				<Script id="datadog-rum">
					{`
window.DD_RUM && window.DD_RUM.init({
    applicationId: "${env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID}",
    clientToken: "${env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN}",
    site: "${env.NEXT_PUBLIC_DD_SITE}",
    service: "${env.NEXT_PUBLIC_DD_SERVICE}",
    env: "${env.NEXT_PUBLIC_DD_ENV}",
    version: "${env.NEXT_PUBLIC_DD_VERSION}",
    sessionSampleRate: ${env.NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE},
    sessionReplaySampleRate: ${env.NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE},
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: "${env.NEXT_PUBLIC_DD_DEFAULT_PRIVACY_LEVEL}",
});
`}
				</Script>
				{shouldLoadVercelClientTelemetry ? <SpeedInsights /> : null}
				{shouldLoadVercelClientTelemetry ? <Analytics /> : null}
			</body>
		</html>
	);
}
