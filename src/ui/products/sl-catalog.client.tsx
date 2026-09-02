"use client";

import { useMemo, useState } from "react";
import type { SlCategoryFacet, SlProductRow } from "@/lib/sl-catalog";
import { SlProductCard } from "@/ui/sl/sl-product-card.client";

/**
 * Loja grid + derived category bar. The facets are computed on the server from
 * the same rows and passed down, so the bar always matches what the catalog
 * actually returned (no separate categories endpoint).
 */
export function SlCatalog({ rows, categories }: { rows: SlProductRow[]; categories: SlCategoryFacet[] }) {
	const [active, setActive] = useState("all");

	const visible = useMemo(
		() => (active === "all" ? rows : rows.filter((row) => row.categoryKey === active)),
		[rows, active],
	);

	// "Tudo" + at least two real categories makes the bar worth showing.
	const showCategoryBar = categories.length > 2;

	return (
		<>
			{showCategoryBar ? (
				<div
					role="tablist"
					aria-label="Categorias da loja"
					className="flex overflow-x-auto border-b border-[color:rgba(11,11,11,0.16)] bg-[color:var(--sl-surface-band)] px-4 sm:px-8 lg:px-12"
				>
					{categories.map((category) => (
						<button
							key={category.key}
							type="button"
							role="tab"
							aria-selected={active === category.key}
							className="sl-tab"
							onClick={() => setActive(category.key)}
						>
							{category.label} · {category.count}
						</button>
					))}
				</div>
			) : null}

			{visible.length > 0 ? (
				<div className="grid grid-cols-2 gap-[var(--sl-grid-gap-sm)] px-4 py-10 sm:px-8 md:gap-[var(--sl-grid-gap)] lg:grid-cols-3 lg:px-12 lg:py-14 xl:grid-cols-4">
					{visible.map((row, index) => (
						<SlProductCard key={row.id} row={row} priority={index < 4} />
					))}
				</div>
			) : (
				<div className="px-4 py-16 sm:px-8 lg:px-12">
					<p className="border border-[color:var(--sl-line-strong)] bg-[color:var(--sl-surface-card)] p-6 text-[14px] leading-[1.7] text-[color:var(--sl-text-muted)]">
						Nada nesta categoria por enquanto. Volte para <strong>Tudo</strong> para ver o catálogo completo
						do selo.
					</p>
				</div>
			)}
		</>
	);
}
