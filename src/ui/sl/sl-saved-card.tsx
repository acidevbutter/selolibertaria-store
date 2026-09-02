import { cn } from "@/lib/utils";

/**
 * A saved card. The brand shows inverted inside a black rectangle — that's how
 * the system absorbs coloured logos without breaking the palette.
 */
export function SlSavedCard({
	brandSrc,
	brandName,
	last4,
	holder,
	expiry,
	selected = false,
	onSelect,
	onRemove,
	className,
}: {
	brandSrc?: string;
	brandName?: string;
	last4?: string | null;
	holder?: string | null;
	expiry?: string | null;
	selected?: boolean;
	onSelect?: () => void;
	onRemove?: () => void;
	className?: string;
}) {
	return (
		<div
			className={cn("flex items-center gap-3 p-3", className)}
			style={{
				border: `1px solid ${selected ? "var(--sl-ink)" : "var(--sl-line-strong)"}`,
				background: selected ? "var(--sl-sand)" : "transparent",
			}}
		>
			<button
				type="button"
				onClick={onSelect}
				aria-pressed={selected}
				className="flex flex-1 items-center gap-3 text-left"
			>
				<span
					className="inline-flex h-8 w-12 flex-none items-center justify-center"
					style={{ background: "var(--sl-ink)" }}
				>
					{brandSrc ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={brandSrc}
							alt={brandName ?? "Cartão"}
							className="h-3.5 w-auto"
							style={{ filter: "invert(1) brightness(2)" }}
						/>
					) : (
						<span className="text-[9px] font-black uppercase tracking-[0.1em] text-[color:var(--sl-text-on-ink)]">
							{brandName ?? "Card"}
						</span>
					)}
				</span>
				<span className="min-w-0">
					<span className="block text-[13px] font-bold">
						{brandName ?? "Cartão"} · final {last4 ?? "••••"}
					</span>
					<span className="block text-[12px] text-[color:var(--sl-text-soft)]">
						{[holder, expiry ? `val. ${expiry}` : null].filter(Boolean).join(" · ")}
					</span>
				</span>
			</button>
			{onRemove ? (
				<button
					type="button"
					onClick={onRemove}
					className="shrink-0 text-[11px] font-black uppercase tracking-[0.16em] text-[color:var(--sl-accent)] underline"
				>
					Remover
				</button>
			) : null}
		</div>
	);
}
