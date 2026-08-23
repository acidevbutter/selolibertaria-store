"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";
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

export default function FooterClient({
	paymentIcons,
	year,
	socialLinks,
	brandName,
	brandEmail,
	brandEyebrow,
	brandDescription,
	newsletterTitle,
	newsletterDescription,
	newsletterPlaceholder,
	newsletterButtonLabel,
	sections,
	copyrightText,
	developedByLabel,
	paymentMethodsLabel,
}: FooterClientProps) {
	const { theme, systemTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isDark = mounted ? (theme === "system" ? systemTheme === "dark" : theme === "dark") : false;

	const iconVariant = (src: string) => {
		if (!isDark || !src.endsWith(".svg") || src.endsWith("-white.svg")) {
			return src;
		}

		return src.replace(/\.svg$/, "-white.svg");
	};

	return (
		<footer className="w-full border-t border-[color:var(--editorial-dark-border)] bg-[color:var(--editorial-ink)] p-6 text-[color:var(--editorial-paper)] md:py-12">
			<div className="container flex max-w-7xl flex-row flex-wrap justify-center gap-16 text-sm sm:justify-between">
				<div className="max-w-sm space-y-6">
					<div className="space-y-2">
						<p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/45">{brandEyebrow}</p>
						<h3 className="editorial-serif text-2xl font-semibold">{brandName}</h3>
						<EditorialRichText
							source={brandDescription}
							className="text-sm leading-relaxed text-primary-foreground/68"
						/>
						<p className="text-sm text-primary-foreground/58">
							<YnsLink href={`mailto:${brandEmail}`} className="underline-offset-4 hover:underline">
								{brandEmail}
							</YnsLink>
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						{socialLinks.map((link) => (
							<YnsLink
								key={link.href}
								href={link.href}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-primary-foreground/84 hover:bg-white/10"
							>
								{link.icon ? (
									<Image
										src={iconVariant(link.icon)}
										alt=""
										aria-hidden="true"
										width={16}
										height={16}
										className="h-4 w-4"
									/>
								) : null}
								<span>{link.label}</span>
							</YnsLink>
						))}
					</div>

					<div id="newsletter" className="flex w-full max-w-sm flex-col gap-2">
						<h3 className="font-semibold text-primary-foreground">{newsletterTitle}</h3>
						<EditorialRichText
							source={newsletterDescription}
							className="text-sm leading-relaxed text-primary-foreground/68"
						/>
						<Newsletter placeholder={newsletterPlaceholder} buttonLabel={newsletterButtonLabel} />
					</div>
				</div>

				<nav className="grid grid-cols-2 gap-12 md:grid-cols-3">
					{sections.map((section) => (
						<section key={section.header}>
							<h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/44">
								{section.header}
							</h3>
							<ul role="list" className="grid gap-1">
								{section.links.map((link) => (
									<li key={`${section.header}-${link.href}`}>
										<YnsLink
											className="text-primary-foreground/76 underline-offset-4 hover:text-primary-foreground hover:underline"
											href={link.href}
										>
											{link.label}
										</YnsLink>
									</li>
								))}
							</ul>
						</section>
					))}
				</nav>
			</div>

			<div className="container mt-8 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-primary-foreground/58 md:flex-row">
				<div className="order-1 w-full text-center md:w-auto md:text-left">
					<p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 md:justify-start">
						<span>
							Copyright © {year} {brandName}. {copyrightText}
						</span>
						<span className="hidden md:inline" aria-hidden="true">
							|
						</span>
						<YnsLink
							href="https://devbutter.tech"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 text-inherit no-underline visited:text-inherit hover:text-inherit hover:no-underline focus:text-inherit focus:no-underline"
							aria-label={`${developedByLabel} DevButter`}
						>
							<span>{developedByLabel}</span>
							<Image
								src="/images/icons/devbutter.svg"
								alt=""
								aria-hidden="true"
								width={20}
								height={20}
								className="h-5 w-5 shrink-0"
							/>
							<span className="font-medium text-primary-foreground">DevButter</span>
						</YnsLink>
					</p>
				</div>

				<div className="order-2 flex w-full items-center justify-center md:w-auto md:justify-end">
					<ul
						className="flex flex-wrap items-center justify-center gap-4 whitespace-nowrap md:flex-nowrap md:justify-end"
						aria-label={paymentMethodsLabel}
					>
						{paymentIcons.map((icon) => (
							<li key={icon.label} className="flex">
								<span className="inline-flex" title={icon.label} aria-label={icon.label}>
									<Image
										src={iconVariant(icon.src)}
										alt={icon.label}
										width={32}
										height={32}
										className="h-8 w-8 object-contain opacity-80 transition-opacity hover:opacity-100"
									/>
									<span className="sr-only">{icon.label}</span>
								</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</footer>
	);
}
