"use client";

import { useState } from "react";
import { fieldPatterns } from "@/lib/admin-product-form-schema";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";

export function VariantPriceFields({
	basePrice,
	currency = "usd",
	overridePrice,
}: {
	basePrice?: number | null;
	currency?: string;
	overridePrice?: number | null;
}) {
	const hasOverride = typeof overridePrice === "number";
	const [mode, setMode] = useState<"inherit" | "override">(hasOverride ? "override" : "inherit");

	return (
		<div className="space-y-4 rounded-md border p-4">
			<div className="space-y-1">
				<h3 className="text-sm font-medium">Price</h3>
				<p className="text-xs text-muted-foreground">
					Variants can inherit the group price or use a custom amount.
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
						<span className="block font-medium">Use group price</span>
						<span className="block text-xs text-muted-foreground">
							{typeof basePrice === "number"
								? `${basePrice.toFixed(2)} ${currency.toUpperCase()}`
								: `Uses the group default in ${currency.toUpperCase()}.`}
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
					<span className="block font-medium">Set custom price</span>
				</label>
			</div>
			<div className="grid gap-4 md:grid-cols-12">
				<div className="space-y-2 md:col-span-5 xl:col-span-4">
					<Label htmlFor="priceOverride">Custom price</Label>
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
				<div className="space-y-2 md:col-span-3 xl:col-span-2">
					<Label htmlFor="currency">Currency</Label>
					<Input
						id="currency"
						name="currency"
						defaultValue={currency.toLowerCase()}
						maxLength={3}
						pattern={fieldPatterns.currency}
						title="Use a 3-letter currency code, such as usd or brl."
						required
						className="max-w-[7rem]"
					/>
				</div>
			</div>
		</div>
	);
}
