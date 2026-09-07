import { SlButton } from "@/ui/sl/sl-button";

/**
 * not-found boundary for the whole (store) route group. Without it, a `notFound()`
 * from a store page (e.g. /category/{slug inexistente}) escapes to the bare root
 * app/not-found.tsx, which renders outside the store Nav/Footer and reads as a
 * blank middle. Keeping the boundary here renders a real not-found state within
 * the store chrome, matching the inline handling on the product page.
 */
export default function StoreNotFound() {
	return (
		<div className="sl-scope" style={{ background: "var(--sl-surface-invert)" }}>
			<div className="mx-auto grid min-h-[60vh] w-full max-w-[var(--sl-w-narrow)] gap-6 px-4 py-20 text-[color:var(--sl-text-on-ink)] sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-12">
				<div className="flex flex-col gap-5">
					<p className="sl-eyebrow m-0 text-[color:var(--sl-text-on-ink-label)]">Selo Libertária</p>
					<h1 className="sl-head m-0 text-[clamp(40px,7vw,var(--sl-size-hero-md))] leading-[0.92]">
						Página não encontrada
					</h1>
					<p className="m-0 max-w-2xl text-[16px] leading-[1.8] text-[color:var(--sl-text-on-ink-muted)]">
						O endereço que você abriu não existe ou saiu do ar. Continue pelo catálogo ou volte para a página
						inicial.
					</p>
				</div>
				<div className="flex flex-wrap gap-3 lg:justify-end">
					<SlButton href="/products" variant="buy">
						Ver a loja
					</SlButton>
					<SlButton href="/" variant="secondary" onInk>
						Página inicial
					</SlButton>
				</div>
			</div>
		</div>
	);
}
