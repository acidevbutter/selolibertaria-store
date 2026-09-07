import { cn } from "@/lib/utils";

// Only Visa and Mastercard have real files (design decision).
// Elo, Amex and Hiper are square wordmarks — never a reconstructed logo.
const BRAND_ICON: Record<string, string> = {
	visa: "/images/icons/visa.svg",
	mastercard: "/images/icons/mastercard.svg",
};

const DEFAULT_BRANDS = ["Visa", "Mastercard", "Elo", "Amex", "Hiper"];

/**
 * Detected from the first 6 digits, but the selector stays visible for manual
 * correction. Purely visual; the hosted checkout owns the real detection.
 */
export function SlCardBrandRow({
	brands = DEFAULT_BRANDS,
	active,
	onSelect,
	className,
}: {
	brands?: string[];
	active?: string | null;
	onSelect?: (brand: string) => void;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<span className="sl-lbl">Bandeira</span>
			<div
				className="grid gap-1.5"
				style={{ gridTemplateColumns: `repeat(${brands.length}, minmax(0, 1fr))` }}
			>
				{brands.map((brand) => {
					const key = brand.toLowerCase();
					const icon = BRAND_ICON[key];
					const selected = active?.toLowerCase() === key;
					const Tag = onSelect ? "button" : "div";
					return (
						<Tag
							key={brand}
							{...(onSelect ? { type: "button" as const, onClick: () => onSelect(brand) } : {})}
							className="flex h-11 items-center justify-center"
							style={{
								border: selected ? "none" : "1px solid rgba(11,11,11,0.28)",
								background: selected ? "var(--sl-ink)" : "transparent",
							}}
						>
							{icon ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={icon}
									alt={brand}
									className="h-4 w-auto"
									style={selected ? { filter: "invert(1) brightness(2)" } : undefined}
								/>
							) : (
								<span
									className="text-[10px] font-black uppercase tracking-[0.1em]"
									style={{ color: selected ? "var(--sl-text-on-ink)" : "rgba(11,11,11,0.75)" }}
								>
									{brand}
								</span>
							)}
						</Tag>
					);
				})}
			</div>
		</div>
	);
}
