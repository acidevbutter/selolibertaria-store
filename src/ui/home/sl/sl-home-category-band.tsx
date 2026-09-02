import type { SlCategoryFacet } from "@/lib/sl-catalog";
import { YnsLink } from "@/ui/yns-link";

/**
 * The sand filter band under the hero: "A loja do selo" + one chip per real
 * category (derived from the catalog), each a door into /products.
 */
export function SlHomeCategoryBand({ categories }: { categories: SlCategoryFacet[] }) {
	if (categories.length <= 1) return null;

	return (
		<div style={{ background: "var(--sl-surface-band)" }}>
			<div className="mx-auto flex w-full max-w-[var(--sl-w-desktop)] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-5 sm:px-8 lg:px-12">
				<p className="sl-u m-0 text-[11px] tracking-[0.26em] text-[color:rgba(11,11,11,0.62)]">
					A loja do selo
				</p>
				<div className="flex flex-wrap gap-2">
					{categories.map((category) => (
						<YnsLink
							key={category.key}
							href="/products"
							className={category.key === "all" ? "sl-chip is-on" : "sl-chip"}
						>
							{category.label} · {category.count}
						</YnsLink>
					))}
				</div>
			</div>
		</div>
	);
}
