import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Trust without a generic store seal — concrete sentences, never a shield icon.
 * Each item states a deadline, the service name, and what happens. No
 * "compra 100% segura".
 */
export function SlTrustList({
	items,
	framed = false,
	className,
}: {
	items: ReactNode[];
	framed?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn("flex flex-col gap-3", framed && "p-5", className)}
			style={
				framed ? { border: "1px solid var(--sl-line)", background: "var(--sl-surface-card)" } : undefined
			}
		>
			{items.map((item, index) => (
				<div key={index} className="flex items-baseline gap-3">
					<span className="font-black text-[color:var(--sl-accent)]">✓</span>
					<p className="m-0 text-[14px] leading-[1.6]">{item}</p>
				</div>
			))}
		</div>
	);
}
