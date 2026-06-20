"use client";

import { useState } from "react";
import { Input } from "@/ui/shadcn/input";

export function VariantPriceFields({
	basePrice,
	overridePrice,
}: {
	basePrice?: number | null;
	overridePrice?: number | null;
}) {
	const hasOverride = typeof overridePrice === "number";
	const [mode, setMode] = useState<"inherit" | "override">(hasOverride ? "override" : "inherit");

	return (
		<div className="space-y-4 rounded-md border p-4">
			<div className="space-y-1">
				<h3 className="text-sm font-medium">Preço</h3>
				<p className="text-xs text-muted-foreground">
					As variantes podem herdar o preço do grupo ou usar um valor específico.
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
						<span className="block font-medium">Usar preço do grupo</span>
						<span className="block text-xs text-muted-foreground">
							{typeof basePrice === "number" ? `${basePrice.toFixed(2)}` : "Usa o preço padrão do grupo."}
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
						type="number"
						step="0.01"
						min="0"
						defaultValue={typeof overridePrice === "number" ? String(overridePrice) : ""}
						disabled={mode !== "override"}
						placeholder="0.00"
						className="max-w-[10rem]"
					/>
				</div>
			</div>
		</div>
	);
}
