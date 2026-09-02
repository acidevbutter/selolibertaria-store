"use client";

import { Newsletter } from "@/ui/footer/newsletter.client";
import { YnsLink } from "@/ui/yns-link";

type PaymentIcon = { label: string; src: string };
type SocialLink = { label: string; href: string; icon: string | null };
type FooterSection = { header: string; links: { label: string; href: string }[] };

type FooterClientProps = {
	paymentIcons: PaymentIcon[];
	year: number;
	socialLinks: SocialLink[];
	brandName: string;
	brandEmail: string;
	brandEyebrow: string;
	brandDescription: string;
	newsletterTitle: string;
	newsletterDescription: string;
	newsletterPlaceholder: string;
	newsletterButtonLabel: string;
	sections: FooterSection[];
	copyrightText: string;
	developedByLabel: string;
	paymentMethodsLabel: string;
};

/**
 * SL SiteFooter — paper background (not black): it closes the page in light,
 * after the manifesto's black block. Newsletter field + three link columns.
 */
export default function FooterClient({
	paymentIcons,
	year,
	socialLinks,
	brandName,
	brandEmail,
	brandEyebrow,
	brandDescription,
	newsletterPlaceholder,
	newsletterButtonLabel,
	sections,
	copyrightText,
	developedByLabel,
	paymentMethodsLabel,
}: FooterClientProps) {
	return (
		<footer
			className="sl-scope w-full border-t border-[color:var(--sl-line-hairline)]"
			style={{ background: "var(--sl-paper)", color: "var(--sl-text)" }}
		>
			<div className="mx-auto flex w-full max-w-[var(--sl-w-desktop)] flex-wrap justify-between gap-12 px-4 py-10 sm:px-8 lg:px-12">
				<div className="flex max-w-[340px] flex-col gap-3">
					<p className="sl-u m-0 text-[11px] tracking-[0.28em] text-[color:var(--sl-text-quiet)]">
						{brandEyebrow}
					</p>
					<p className="m-0 text-[14px] leading-[1.7] text-[color:var(--sl-text-muted)]">
						{brandDescription}
					</p>
					<Newsletter placeholder={newsletterPlaceholder} buttonLabel={newsletterButtonLabel} />
					<div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
						<YnsLink href={`mailto:${brandEmail}`} className="sl-link">
							{brandEmail}
						</YnsLink>
						{socialLinks.map((link) => (
							<YnsLink key={link.href} href={link.href} target="_blank" rel="noreferrer" className="sl-link">
								{link.label}
							</YnsLink>
						))}
					</div>
				</div>

				<nav className="grid grid-cols-2 gap-x-12 gap-y-8 text-[13px] sm:grid-cols-3 sm:gap-x-14">
					{sections.map((section) => (
						<div key={section.header}>
							<p className="sl-u m-0 mb-3 text-[11px] tracking-[0.24em] text-[color:var(--sl-text-quiet)]">
								{section.header}
							</p>
							<ul className="m-0 flex list-none flex-col gap-2 p-0">
								{section.links.map((link) => (
									<li key={`${section.header}-${link.href}`}>
										<YnsLink
											href={link.href}
											className="text-[color:rgba(11,11,11,0.75)] transition-colors hover:text-[color:var(--sl-accent)]"
										>
											{link.label}
										</YnsLink>
									</li>
								))}
							</ul>
						</div>
					))}
				</nav>
			</div>

			<div className="mx-auto flex w-full max-w-[var(--sl-w-desktop)] flex-col items-center justify-between gap-4 border-t border-[color:var(--sl-line-hairline)] px-4 py-5 text-[12px] text-[color:var(--sl-text-soft)] sm:px-8 md:flex-row lg:px-12">
				<p className="m-0 flex flex-wrap items-center justify-center gap-x-2 md:justify-start">
					<span>
						Copyright © {year} {brandName}. {copyrightText}
					</span>
					<YnsLink
						href="https://devbutter.tech"
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-2 text-inherit no-underline hover:text-inherit"
						aria-label={`${developedByLabel} DevButter`}
					>
						<span>· {developedByLabel}</span>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src="/images/icons/devbutter.svg" alt="" aria-hidden="true" className="h-4 w-4" />
						<span className="font-bold text-[color:var(--sl-text)]">DevButter</span>
					</YnsLink>
				</p>
				<ul
					className="m-0 flex list-none flex-wrap items-center justify-center gap-2 p-0"
					aria-label={paymentMethodsLabel}
				>
					{paymentIcons.map((icon) => (
						<li
							key={icon.label}
							className="inline-flex h-[26px] items-center justify-center px-2.5"
							style={{ border: "1px solid var(--sl-line-strong)" }}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={icon.src} alt={icon.label} className="h-3.5 w-auto object-contain" />
						</li>
					))}
				</ul>
			</div>
		</footer>
	);
}
