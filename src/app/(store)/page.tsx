import Image from "next/image";
import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { commerce } from "@/lib/commerce";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { AboutSection } from "@/ui/about-section";
import HeroShell from "@/ui/hero-shell.client";
import { ProductList } from "@/ui/products/product-list";
import { YnsLink } from "@/ui/yns-link";

export const metadata: Metadata = {
	alternates: { canonical: publicUrl },
};

export const dynamic = "force-dynamic";

export default async function Home() {
	try {
		// Load products from YNS using REST API (default behavior)
		const result = await commerce.product.browse({ first: 6, currency: await getRequestPreferredCurrency() });
		const t = await getTranslations("/");

		const products = result.data || [];

		return (
			<main>
				<HeroShell>
					<div className="mx-auto grid grid-cols-1 items-center justify-items-center gap-8 px-8 sm:px-16 md:grid-cols-2">
						<div className="max-w-md space-y-4 glitch">
							<h2
								className="glitch-text text-balance font-bold text-center text-red-700 tracking-tight md:text-7xl text-5xl lg:text-8xl"
								data-text={t("hero.title")}
							>
								{t("hero.title")}
							</h2>
							<p className="text-pretty text-neutral-600">{t("hero.description")}</p>
							{/* <YnsLink
								className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-900 px-6 font-medium text-neutral-50 transition-colors hover:bg-neutral-900/90 focus:outline-hidden focus:ring-1 focus:ring-neutral-950"
								href={t("hero.link")}
							>
								{t("hero.action")}
							</YnsLink> */}
						</div>
						<Image
							alt="Ratoeira77"
							loading="eager"
							priority={true}
							className="rounded"
							height={450}
							width={450}
							src="/images/ratoeira/ratoeira-loja.jpeg"
							style={{
								objectFit: "cover",
							}}
							sizes="(max-width: 640px) 70vw, 450px"
						/>
					</div>
				</HeroShell>

				<ProductList products={products} />

				<AboutSection />
			</main>
		);
	} catch (error) {
		console.error("Error in Home component:", error);
		const t = await getTranslations("/");

		// Fallback to empty products if YNS fails
		const products: never[] = [];

		return (
			<main>
				<HeroShell>
					<div className="mx-auto grid grid-cols-1 items-center justify-items-center gap-8 px-8 sm:px-16 md:grid-cols-2">
						<div className="max-w-md space-y-4 glitch screen">
							<h2
								className="text-balance text-3xl font-bold tracking-tight md:text-4xl glitch-text"
								data-text={t("hero.title")}
							>
								{t("hero.title")}
							</h2>
							<p className="text-pretty text-neutral-600">{t("hero.description")}</p>
							<YnsLink
								className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-900 px-6 font-medium text-neutral-50 transition-colors hover:bg-neutral-900/90 focus:outline-hidden focus:ring-1 focus:ring-neutral-950"
								href={t("hero.link")}
							>
								{t("hero.action")}
							</YnsLink>
						</div>
						<Image
							alt="Ratoeira77"
							loading="eager"
							priority={true}
							className="rounded"
							height={450}
							width={450}
							src="https://files.stripe.com/links/MDB8YWNjdF8xT3BaeG5GSmNWbVh6bURsfGZsX3Rlc3RfaDVvWXowdU9ZbWlobUIyaHpNc1hCeDM200CBzvUjqP"
							style={{
								objectFit: "cover",
							}}
							sizes="(max-width: 640px) 70vw, 450px"
						/>
					</div>
				</HeroShell>

				<ProductList products={products} />
				<div className="text-center text-red-500 p-4">
					{t("error.loadingProducts", {
						message: error instanceof Error ? error.message : t("error.unknown"),
					})}
					<br />
					<small>{t("error.serverLogs")}</small>
				</div>
			</main>
		);
	}
}
