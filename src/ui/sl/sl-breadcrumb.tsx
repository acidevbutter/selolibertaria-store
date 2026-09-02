import { Fragment } from "react";
import { YnsLink } from "@/ui/yns-link";

/** PDP-only breadcrumb. Separator is " / " with spaces; the last segment (the
 * product title) stays as published — lowercase if that's how the cover has it. */
export function SlBreadcrumb({ segments }: { segments: Array<{ label: string; href?: string }> }) {
	return (
		<p className="m-0 text-[12px] uppercase tracking-[0.18em] text-[color:var(--sl-text-soft)]">
			{segments.map((segment, index) => {
				const isLast = index === segments.length - 1;
				return (
					<Fragment key={`${segment.label}-${index}`}>
						{index > 0 ? <span> / </span> : null}
						{segment.href && !isLast ? (
							<YnsLink href={segment.href} className="sl-link">
								{segment.label}
							</YnsLink>
						) : (
							<span style={isLast ? { color: "var(--sl-accent)" } : undefined}>{segment.label}</span>
						)}
					</Fragment>
				);
			})}
		</p>
	);
}
