import Image from "next/image";
import { SlButton } from "@/ui/sl/sl-button";

/**
 * Home hero from the UI kit: ink surface, 96px lowercase-safe Fertigo headline,
 * DCC-Ash price, buy + "read excerpt" actions, and a dry three-item meta row.
 */
export function SlHomeHero({
	eyebrow,
	tags = [],
	title,
	blurb,
	imageUrl,
	imageAlt,
	priceLabel,
	installmentLabel,
	primaryHref,
	primaryLabel,
	secondaryHref,
	secondaryLabel,
	metaItems = [],
}: {
	eyebrow: string;
	tags?: string[];
	title: string;
	blurb: string;
	imageUrl: string;
	imageAlt: string;
	priceLabel?: string | null;
	installmentLabel?: string | null;
	primaryHref: string;
	primaryLabel: string;
	secondaryHref: string;
	secondaryLabel: string;
	metaItems?: string[];
}) {
	return (
		<section
			className="text-[color:var(--sl-text-on-ink)]"
			style={{ background: "var(--sl-surface-invert)" }}
		>
			<div className="mx-auto grid w-full max-w-[var(--sl-w-desktop)] items-center gap-12 px-4 py-12 sm:px-8 lg:grid-cols-[1fr_minmax(320px,520px)] lg:gap-16 lg:px-12 lg:py-16">
				<div className="flex flex-col gap-6">
					<div className="flex flex-wrap gap-2">
						<span className="sl-u inline-flex h-[26px] items-center bg-[color:var(--sl-buy)] px-[10px] text-[10px] tracking-[0.22em]">
							{eyebrow}
						</span>
						{tags.map((tag) => (
							<span
								key={tag}
								className="sl-u inline-flex h-[26px] items-center border border-[color:var(--sl-line-on-ink-mid)] px-[10px] text-[10px] tracking-[0.22em] text-[color:var(--sl-text-on-ink-muted)]"
							>
								{tag}
							</span>
						))}
					</div>

					<h1
						className="sl-head m-0 max-w-[14ch] text-[clamp(48px,9vw,var(--sl-size-hero-xl))] leading-[0.9]"
						style={{ letterSpacing: "var(--sl-track-hero)" }}
					>
						{title}
					</h1>

					<p className="m-0 max-w-[44ch] text-[17px] leading-[1.75] text-[color:var(--sl-text-on-ink-muted)]">
						{blurb}
					</p>

					{priceLabel ? (
						<div className="flex flex-wrap items-baseline gap-4">
							<span className="sl-price text-[clamp(32px,5vw,44px)]" style={{ letterSpacing: "-0.03em" }}>
								{priceLabel}
							</span>
							{installmentLabel ? (
								<span className="text-[14px] text-[color:var(--sl-text-on-ink-soft)]">
									{installmentLabel}
								</span>
							) : null}
						</div>
					) : null}

					<div className="flex flex-wrap gap-3">
						<SlButton href={primaryHref} variant="buy">
							{primaryLabel}
						</SlButton>
						<SlButton href={secondaryHref} variant="secondary" onInk>
							{secondaryLabel}
						</SlButton>
					</div>

					{metaItems.length > 0 ? (
						<div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[color:var(--sl-text-on-ink-soft)]">
							{metaItems.map((item) => (
								<span key={item}>{item}</span>
							))}
						</div>
					) : null}
				</div>

				<div
					className="relative aspect-square w-full overflow-hidden"
					style={{ background: "var(--sl-surface-desk)" }}
				>
					{imageUrl ? (
						<Image
							src={imageUrl}
							alt={imageAlt}
							fill
							priority
							sizes="(max-width: 1024px) 90vw, 520px"
							className="object-cover"
						/>
					) : null}
				</div>
			</div>
		</section>
	);
}
