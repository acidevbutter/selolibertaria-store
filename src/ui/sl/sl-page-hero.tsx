import type { ReactNode } from "react";
import { SlEyebrow } from "@/ui/sl/sl-section-head";

/**
 * The single ink page-hero from the UI kit — used by loja, and available for
 * projetos / sarau / sobre / contato / FAQ so every internal page opens the same way.
 */
export function SlPageHero({
	eyebrow,
	title,
	lead,
	aside,
}: {
	eyebrow: string;
	title: ReactNode;
	lead?: ReactNode;
	aside?: ReactNode;
}) {
	return (
		<section
			className="text-[color:var(--sl-text-on-ink)]"
			style={{ background: "var(--sl-surface-invert)" }}
		>
			<div className="mx-auto flex w-full max-w-[var(--sl-w-desktop)] flex-col items-start justify-between gap-8 px-4 py-10 sm:px-8 lg:flex-row lg:items-end lg:px-12 lg:py-12">
				<div className="flex max-w-[52ch] flex-col gap-3">
					<SlEyebrow onInk>{eyebrow}</SlEyebrow>
					<h1 className="sl-head m-0 text-[clamp(38px,6vw,var(--sl-size-hero-md))] leading-[0.95]">
						{title}
					</h1>
					{lead ? (
						<p className="m-0 text-[15px] leading-[1.7] text-[color:var(--sl-text-on-ink-muted)]">{lead}</p>
					) : null}
				</div>
				{aside ? <div className="flex shrink-0 flex-wrap gap-2">{aside}</div> : null}
			</div>
		</section>
	);
}
