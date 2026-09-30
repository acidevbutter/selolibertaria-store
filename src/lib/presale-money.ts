/**
 * The backend keeps every money amount in centavos -- the catalog (`little-fish-big-fish` = 4990), the cart's
 * `unit_amount`, and therefore the presale's `presale_price`/`full_price`, which the cart uses as the
 * line price while the presale is live (`PresalesService.resolve_unit_price`). The presale UI (wizard inputs,
 * discount %, the public landing) works in reais. Convert exactly once, at the API boundary, so a value
 * never crosses it in the wrong unit: reading R$ 49,90 as "R$ 4990,00" (and a discount of -99%), or
 * saving the 39,90 an editor typed as 39.9 centavos.
 */

export function centsToReais(cents: number | string | null | undefined): number {
	const value = Number(cents);
	return Number.isFinite(value) ? Math.round(value) / 100 : 0;
}

export function reaisToCents(reais: number | string | null | undefined): number {
	const value = Number(reais);
	// `e2` shifts the decimal point in the string form, avoiding binary float drift (1.005 * 100 = 100.49999...).
	return Number.isFinite(value) ? Math.round(Number(`${value}e2`)) : 0;
}
