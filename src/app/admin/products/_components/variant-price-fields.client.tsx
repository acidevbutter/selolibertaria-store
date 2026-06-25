"use client";

import { useState } from "react";
import { Input } from "@/ui/shadcn/input";

function formatDecimalWhileTyping(value: string) {
	const normalized = value
		.replace(/\s+/g, "")
		.replace(/\./g, ",")
		.replace(/[^0-9,]/g, "");
	const [integerPart = "", ...decimalParts] = normalized.split(",");
	const decimalPart = decimalParts.join("");
	return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
}

function formatDecimalOnBlur(value: string) {
	return formatDecimalWhileTyping(value).replace(/^,/, "").replace(/,$/, "");
}

export function VariantPriceFields({
	basePrice,
	currency,
	locale,
	overridePrice,
}: {
	basePrice?: number | null;
	currency: string;
	locale: string;
	overridePrice?: number | null;
}) {
	const hasOverride = typeof overridePrice === "number";
	const [mode, setMode] = useState<"inherit" | "override">(hasOverride ? "override" : "inherit");
	const inheritedPriceLabel =
		typeof basePrice === "number"
			? new Intl.NumberFormat(locale, { style: "currency", currency }).format(basePrice)
			: null;

	return (
		<div className="space-y-4 rounded-md border p-4">
			<div className="space-y-1">
				<h3 className="text-sm font-medium">Preço</h3>
				<p className="text-xs text-muted-foreground">
					As variantes podem herdar o preço do livro ou usar um valor específico.
				</p>
			</div>
			<input type="hidden" name="basePrice" value={typeof basePrice === "number" ? String(basePrice) : ""} />
			<div className="space-y-3">
				<label className="flex items-start gap-3 rounded-md border px-3 py-3 text-sm">
					<input
						type="radio"
						name="priceMode"
						value="inherit"
						checked={mode === "inherit"}
						onChange={() => setMode("inherit")}
						className="mt-0.5"
					/>
					<span className="space-y-1">
						<span className="block font-medium">Usar preço do livro</span>
						<span className="block text-xs text-muted-foreground">
							{inheritedPriceLabel ? inheritedPriceLabel : "Usa o preço padrão do livro."}
						</span>
					</span>
				</label>
				<label className="flex items-start gap-3 rounded-md border px-3 py-3 text-sm">
					<input
						type="radio"
						name="priceMode"
						value="override"
						checked={mode === "override"}
						onChange={() => setMode("override")}
						className="mt-0.5"
					/>
					<span className="block font-medium">Definir preço próprio</span>
				</label>
			</div>
			<div className="grid gap-4 md:grid-cols-12">
				<div className="space-y-2 md:col-span-5 xl:col-span-4">
					<label htmlFor="priceOverride" className="text-sm font-medium">
						Preço da variante
					</label>
					<Input
						id="priceOverride"
						name="priceOverride"
						type="text"
						inputMode="decimal"
						defaultValue={typeof overridePrice === "number" ? String(overridePrice).replace(".", ",") : ""}
						disabled={mode !== "override"}
						placeholder="19,90"
						className="max-w-[10rem]"
						onChange={(event) => {
							event.currentTarget.value = formatDecimalWhileTyping(event.currentTarget.value);
						}}
						onInput={(event) => {
							event.currentTarget.value = formatDecimalWhileTyping(event.currentTarget.value);
						}}
						onBlur={(event) => {
							event.currentTarget.value = formatDecimalOnBlur(event.currentTarget.value);
						}}
					/>
					<p className="text-xs text-muted-foreground">Use valor decimal, como 19,90.</p>
				</div>
			</div>
		</div>
	);
}
