import "@/app/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import localFont from "next/font/local";
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
	const messages = await getMessages();

	return (
		<html
			lang="pt-BR"
			suppressHydrationWarning
			className={`h-full antialiased ${dccAsh.variable} ${fertigoPro.variable}`}
		>
			<body className="display-font flex min-h-full flex-col bg-background text-foreground">
				{/* Pre-hydration splash: insert a neutral overlay before React hydrates to avoid FOUC */}
				<Script
					id="splash-preinit"
					strategy="beforeInteractive"
					dangerouslySetInnerHTML={{
						__html:
							"(() => {\n" +
							"  var cleanup = function() {\n" +
							"    var pre = document.getElementById('selolibertaria-splash-pre');\n" +
							"    var style = document.getElementById('selolibertaria-splash-style');\n" +
							"    if (pre && pre.parentNode) pre.parentNode.removeChild(pre);\n" +
							"    if (style && style.parentNode) style.parentNode.removeChild(style);\n" +
							"  };\n" +
							"  var path = window.location.pathname || '/';\n" +
							"  if (path.startsWith('/admin') || path.startsWith('/login')) return;\n" +
							"  try {\n" +
							"    if (localStorage.getItem('selolibertaria_splash_seen')) return;\n" +
							"  } catch (e) {}\n" +
							"  var style = document.createElement('style');\n" +
							"  style.id = 'selolibertaria-splash-style';\n" +
							"  style.textContent = '#selolibertaria-splash-pre{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#111827;color:#f9fafb;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif}.selolibertaria-splash-percent{font-weight:700;font-size:3.5rem}';\n" +
							"  document.head.appendChild(style);\n" +
							"  var div = document.createElement('div');\n" +
							"  div.id = 'selolibertaria-splash-pre';\n" +
							"  var percent = document.createElement('div');\n" +
							"  percent.className = 'selolibertaria-splash-percent';\n" +
							"  percent.textContent = '0%';\n" +
							"  div.appendChild(percent);\n" +
							"  document.documentElement.appendChild(div);\n" +
							"  window.addEventListener('load', function() { window.setTimeout(cleanup, 1800); }, { once: true });\n" +
							"  window.setTimeout(cleanup, 4500);\n" +
							"})();",
					}}
				/>

				<SplashLoader />
				<ThemeProviderWrapper>
					<IntlClientProvider messages={messages} locale="pt-BR">
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
				{shouldLoadVercelClientTelemetry ? <SpeedInsights /> : null}
				{shouldLoadVercelClientTelemetry ? <Analytics /> : null}
			</body>
		</html>
	);
}
