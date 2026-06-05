import { getTranslations } from "@/i18n/server";
import type { Product } from "@/lib/commerce-types";
import { ProductList } from "@/ui/products/product-list";
import { YnsLink } from "@/ui/yns-link";

export async function HomeFeaturedBooks({ products }: { products: Product[] }) {
	const t = await getTranslations("Selo");

	return (
		<section className="space-y-4">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground sm:text-sm">
						{t("home.featured.eyebrow")}
					</p>
					<h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
						{t("home.featured.title")}
					</h2>
				</div>
				<YnsLink href="/products" className="text-sm font-medium underline underline-offset-4">
					{t("home.featured.link")}
				</YnsLink>
			</div>
			<ProductList products={products} />
		</section>
	);
}
