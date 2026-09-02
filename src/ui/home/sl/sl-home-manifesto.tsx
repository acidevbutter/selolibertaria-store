import { SlButton } from "@/ui/sl/sl-button";

/**
 * Ink manifesto block from the UI kit, split with the "Sarau Safado · próxima
 * edição" panel (Data / Local / Entrada in DCC Ash) on the right.
 */
export function SlHomeManifesto({
	eyebrow = "Manifesto",
	title,
	body,
	linkLabel,
	linkHref,
	sarau,
}: {
	eyebrow?: string;
	title: string;
	body: string;
	linkLabel: string;
	linkHref: string;
	sarau: {
		eyebrow: string;
		data: string;
		local: string;
		entrada: string;
		ctaLabel: string;
		ctaHref: string;
	};
}) {
	const stats: Array<{ label: string; value: string }> = [
		{ label: "Data", value: sarau.data },
		{ label: "Local", value: sarau.local },
		{ label: "Entrada", value: sarau.entrada },
	];

	return (
		<section
			className="text-[color:var(--sl-text-on-ink)]"
			style={{ background: "var(--sl-surface-invert)" }}
		>
			<div className="mx-auto grid w-full max-w-[var(--sl-w-desktop)] gap-12 px-4 py-14 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-12">
				<div className="flex flex-col gap-5">
					<p className="sl-eyebrow m-0 text-[color:var(--sl-text-on-ink-label)]">{eyebrow}</p>
					<h2
						className="sl-head m-0 max-w-[18ch] text-[clamp(32px,5vw,var(--sl-size-section))] leading-[0.98]"
						style={{ letterSpacing: "var(--sl-track-head)" }}
					>
						{title}
					</h2>
					<p className="m-0 max-w-[48ch] text-[16px] leading-[1.8] text-[color:var(--sl-text-on-ink-muted)]">
						{body}
					</p>
					<SlButton href={linkHref} variant="secondary" onInk className="self-start">
						{linkLabel}
					</SlButton>
				</div>

				<div className="flex flex-col gap-4 border-[color:var(--sl-line-on-ink)] lg:border-l lg:pl-12">
					<p className="sl-eyebrow m-0 text-[color:var(--sl-text-on-ink-label)]">{sarau.eyebrow}</p>
					<div className="grid grid-cols-3 gap-5">
						{stats.map((stat) => (
							<div key={stat.label}>
								<p className="m-0 text-[11px] uppercase tracking-[0.2em] text-[color:var(--sl-text-on-ink-quiet)]">
									{stat.label}
								</p>
								<p className="sl-price m-0 mt-1.5 text-[20px]">{stat.value}</p>
							</div>
						))}
					</div>
					<SlButton href={sarau.ctaHref} variant="buy" className="self-start">
						{sarau.ctaLabel}
					</SlButton>
				</div>
			</div>
		</section>
	);
}
