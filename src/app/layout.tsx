import "@/app/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { CheckoutSuccessHandler } from "@/components/checkout-success-handler.client";
import { CredentialSaveOnAuth } from "@/components/credential-save-on-auth.client";
import SplashLoader from "@/components/splash-loader.client";
import ThemeProviderWrapper from "@/components/theme-provider.client";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/context/cart-context";
import { env, publicUrl } from "@/env.mjs";
import { IntlClientProvider } from "@/i18n/client";
import { getLocale, getMessages, getTranslations } from "@/i18n/server";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("Global.metadata");
	return {
		title: t("title"),
		description: t("description"),
		metadataBase: new URL(publicUrl),
		icons: {
			icon: [
				{ url: "/images/ratoeira/ratoeira-red.png", type: "image/png", sizes: "1080x1080" },
				{ url: "/images/ratoeira/ratoeira-red.svg", type: "image/svg+xml" },
			],
			shortcut: ["/images/ratoeira/ratoeira-red.png"],
			apple: [{ url: "/images/ratoeira/ratoeira-red.png", sizes: "180x180", type: "image/png" }],
		},
	};
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale} className="h-full antialiased dark">
			<body className="flex min-h-full flex-col bg-background text-foreground">
				{/* Pre-hydration splash: insert a red overlay before React hydrates to avoid FOUC */}
				<Script
					id="splash-preinit"
					strategy="beforeInteractive"
					dangerouslySetInnerHTML={{
						__html:
							"(() => {\n" +
							"  try {\n" +
							"    if (localStorage.getItem('ratoeira_splash_seen')) return;\n" +
							"  } catch (e) {}\n" +
							"  var style = document.createElement('style');\n" +
							"  style.id = 'ratoeira-splash-style';\n" +
							"  style.textContent = '#ratoeira-splash-pre{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#b91c1c;color:#fff;font-family:Vtks Urticaria,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif}.ratoeira-splash-percent{font-weight:700;font-size:3.5rem}';\n" +
							"  document.head.appendChild(style);\n" +
							"  var div = document.createElement('div');\n" +
							"  div.id = 'ratoeira-splash-pre';\n" +
							"  div.innerHTML = '<div class=\'ratoeira-splash-percent\'>0%</div>';\n" +
							"  document.documentElement.appendChild(div);\n" +
							"})();",
					}}
				/>

				<SplashLoader />
				{/* Set initial theme class before hydration to avoid FOUC / hydration mismatches. */}
				<Script
					id="theme-init"
					strategy="beforeInteractive"
					dangerouslySetInnerHTML={{
						__html: `(() => {
							try {
								const key = 'theme';
								const stored = localStorage.getItem(key);
								const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
								if (stored === 'dark' || (!stored && prefersDark)) {
									document.documentElement.classList.add('dark');
								} else {
									document.documentElement.classList.remove('dark');
								}
							} catch (e) {
								// ignore
							}
						})();`,
					}}
				/>
				<ThemeProviderWrapper>
					<IntlClientProvider messages={messages} locale={locale}>
						<Suspense fallback={null}>
							<CartProvider>
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
				<SpeedInsights />
				<Analytics />
			</body>
		</html>
	);
}
