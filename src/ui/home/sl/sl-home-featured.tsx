import type { SlProductRow } from "@/lib/sl-catalog";
import { SlButton } from "@/ui/sl/sl-button";
import { SlProductCard } from "@/ui/sl/sl-product-card.client";
import { SlSectionHead } from "@/ui/sl/sl-section-head";

/** "Em destaque" — the four-up product row on the home, same card as the loja. */
export function SlHomeFeatured({ rows }: { rows: SlProductRow[] }) {
	if (rows.length === 0) return null;

	return (
		<section style={{ background: "var(--sl-surface-page)" }}>
			<div className="mx-auto flex w-full max-w-[var(--sl-w-desktop)] flex-col gap-8 px-4 py-14 sm:px-8 lg:px-12">
				<SlSectionHead
					title="Em destaque"
					action={
						<SlButton href="/products" variant="secondary">
							Ver a loja completa
						</SlButton>
					}
				/>
				<div className="grid grid-cols-2 gap-[var(--sl-grid-gap-sm)] md:gap-[var(--sl-grid-gap)] lg:grid-cols-4">
					{rows.slice(0, 4).map((row, index) => (
						<SlProductCard key={row.id} row={row} priority={index < 2} />
					))}
				</div>
			</div>
		</section>
	);
}
