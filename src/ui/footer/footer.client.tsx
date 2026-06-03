"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "@/i18n/client";
import { Newsletter } from "@/ui/footer/newsletter.client";
import { YnsLink } from "@/ui/yns-link";

type PaymentIcon = { label: string; src: string };
type Category = { name: string; slug: string };

export const FooterClient = ({
	newsletterTitle,
	paymentIcons,
	dynamicCategories,
	year,
}: {
	newsletterTitle: string;
	paymentIcons: PaymentIcon[];
	dynamicCategories: Category[];
	year: number;
}) => {
	const { theme, systemTheme } = useTheme();
	const t = useTranslations("Global.footer");
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const isDark = mounted ? (theme === "system" ? systemTheme === "dark" : theme === "dark") : false;

	const iconVariant = (src: string) => {
		if (!isDark) return src;
		if (!src.endsWith(".svg")) return src;
		if (src.endsWith("-white.svg")) return src;
		const parts = src.split(".svg");
		return `${parts[0]}-white.svg`;
	};

	const sections = [
		{
			header: t("categoriesTitle"),
			links: dynamicCategories.map(({ name, slug }) => ({ label: name, href: `/category/${slug}` })),
		},
		{
			header: t("supportTitle"),
			links: [
				{ label: t("links.faq"), href: "/faq" },
				{ label: t("links.contact"), href: "/contact" },
			],
		},
		{
			header: t("legalTitle"),
			links: [
				{ label: t("links.terms"), href: "/terms" },
				{ label: t("links.privacy"), href: "/privacy" },
			],
		},
	];

	return (
		<footer className="w-full bg-background p-6 text-foreground md:py-12">
			<div className="container flex max-w-7xl flex-row flex-wrap justify-center gap-16 text-sm sm:justify-between">
				<div className="">
					<div className="flex w-full max-w-sm flex-col gap-2">
						<h3 className="font-semibold">{newsletterTitle}</h3>
						<Newsletter />
					</div>
				</div>

				<nav className="grid grid-cols-2 gap-16">
					{sections.map((section) => (
						<section key={section.header}>
							<h3 className="mb-2 font-semibold">{section.header}</h3>
							<ul role="list" className="grid gap-1">
								{section.links.map((link) => (
									<li key={link.label}>
										<YnsLink className="underline-offset-4 hover:underline" href={link.href}>
											{link.label}
										</YnsLink>
									</li>
								))}
							</ul>
						</section>
					))}
				</nav>
			</div>

			<div className="container mt-8 flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
				<div className="order-1 w-full text-center md:w-auto md:text-left">
					<p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 md:justify-start">
						<span>{t("copyright", { year })}</span>
						<span className="hidden md:inline" aria-hidden="true">
							|
						</span>
						<YnsLink
							href="https://devbutter.tech"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 text-inherit no-underline visited:text-inherit hover:text-inherit hover:no-underline focus:text-inherit focus:no-underline"
							aria-label={`${t("developedBy")} DevButter`}
						>
							<span>{t("developedBy")}</span>
							<Image
								src="/images/icons/devbutter.svg"
								alt=""
								aria-hidden="true"
								width={20}
								height={20}
								className="h-5 w-5 shrink-0"
							/>
							<span className="font-medium text-foreground">DevButter</span>
						</YnsLink>
					</p>
				</div>

				<div className="order-2 flex w-full items-center justify-center md:w-auto md:justify-end">
					<ul
						className="flex flex-wrap items-center justify-center gap-4 whitespace-nowrap md:flex-nowrap md:justify-end"
						aria-label={t("acceptedPayments")}
					>
						{paymentIcons.map((icon) => (
							<li key={icon.label} className="flex">
								<span className="inline-flex" title={icon.label} aria-label={icon.label}>
									<Image
										src={iconVariant(icon.src)}
										alt={icon.label}
										width={52}
										height={32}
										className="h-8 w-auto object-contain opacity-80 transition-opacity hover:opacity-100"
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
};

export default FooterClient;
