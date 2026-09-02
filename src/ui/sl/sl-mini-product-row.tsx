import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { YnsLink } from "@/ui/yns-link";

/**
 * A product reduced to one line — for the order summary and "related" rails.
 * Never use `SlProductCard` in those places; this is the row.
 */
export function SlMiniProductRow({
	image,
	category,
	title,
	meta,
	price,
	href,
	framed = true,
	className,
}: {
	image?: ReactNode;
	category?: ReactNode;
	title: ReactNode;
	meta?: ReactNode;
	price?: ReactNode;
	href?: string;
	framed?: boolean;
	className?: string;
}) {
	const body = (
		<div
			className={cn("flex items-center gap-3", framed && "p-3", className)}
			style={
				framed
					? { border: "1px solid var(--sl-line-hairline)", background: "var(--sl-surface-card)" }
					: undefined
			}
		>
			{image ? (
				<div className="h-14 w-14 flex-none overflow-hidden" style={{ background: "var(--sl-sand)" }}>
					{image}
				</div>
			) : null}
			<div className="min-w-0 flex-1">
				{category ? (
					<p className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--sl-text-quiet)]">
						{category}
					</p>
				) : null}
				<p className="sl-price m-0 mt-1 text-[16px] leading-tight">{title}</p>
				{meta ? <p className="m-0 mt-1 text-[12px] text-[color:var(--sl-text-soft)]">{meta}</p> : null}
			</div>
			{price ? <span className="shrink-0 text-[14px]">{price}</span> : null}
		</div>
	);

	return href ? (
		<YnsLink href={href} className="block">
			{body}
		</YnsLink>
	) : (
		body
	);
}
