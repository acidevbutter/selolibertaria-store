/**
 * Pré-venda real: tipos e helpers isomórficos ligados ao domínio
 * `app/presales/` do backend (preço, `launch_at`, reservas), não ao
 * `StoreSettings.preSale` genérico (aposentado).
 *
 * Por enquanto a loja só tem uma pré-venda possível: little fish, big fish.
 * O backend já é genérico por produto; não construímos um seletor de
 * produtos aqui sem necessidade concreta.
 */

export const LITTLE_FISH_BIG_FISH_PRODUCT_ID = "product_little-fish-big-fish";
export const LITTLE_FISH_BIG_FISH_VARIANT_ID = "variant_little-fish-big-fish_impresso";
export const LITTLE_FISH_BIG_FISH_SLUG = "little-fish-big-fish";

export type PresaleStatus = "rascunho" | "no_ar" | "encerrada";

export type PresalePublic = {
	productId: string;
	variantId: string;
	launchAt: string;
	presalePrice: number;
	fullPrice: number;
	status: PresaleStatus;
	modalEnabled: boolean;
	modalIntervalHours: number;
	modalTitle: string;
	modalBody: string;
};

export function formatBRL(value: number): string {
	return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/** Percentual de desconto, arredondado — 0 se o preço cheio for inválido. */
export function presaleDiscountPercent(fullPrice: number, presalePrice: number): number {
	if (!(fullPrice > 0)) return 0;
	return Math.round((1 - presalePrice / fullPrice) * 100);
}

export function formatLongDate(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

/** "outubro de 2026" -- the launch window copy on the public landing, from the configured date. */
export function formatLaunchWindow(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "em breve";
	return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function formatShortDate(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
