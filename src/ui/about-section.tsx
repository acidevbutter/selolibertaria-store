import Image from "next/image";
import type { ElementType } from "react";
import { getTranslations } from "@/i18n/server";
import { YnsLink } from "@/ui/yns-link";

type AboutSectionProps = {
	className?: string;
	showReadMore?: boolean;
	headingTag?: "h1" | "h2";
	imageSrc?: string;
	imageAlt?: string;
	title?: string;
	body?: string;
	extended?: string;
};

export async function AboutSection({
	className,
	showReadMore = true,
	headingTag = "h2",
	imageSrc,
	imageAlt,
	title,
	body,
	extended,
}: AboutSectionProps) {
	const t = await getTranslations("Selo");
	const Heading: ElementType = headingTag;
	const resolvedTitle = title ?? t("about.sectionTitle");
	const resolvedBody = body ?? t("about.sectionBody");
	const resolvedExtended = extended ?? null;

	return (
		<section
			className={
				className ??
				"border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-beige)] py-10 sm:py-14"
			}
		>
			<div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-8 sm:px-12 md:grid-cols-2">
				<div className="flex justify-center md:justify-start">
					{imageSrc ? (
						<Image
							src={imageSrc}
							alt={imageAlt || resolvedTitle}
							width={420}
							height={420}
							className="border border-[color:var(--editorial-ink)] object-cover"
							style={{ objectFit: "cover" }}
							priority={false}
						/>
					) : (
						<div className="flex h-[420px] w-[420px] max-w-full items-center justify-center border border-[color:var(--editorial-ink)] bg-[color:rgba(216,208,196,0.22)] p-8 text-center text-[color:var(--editorial-muted)]">
							<p className="max-w-xs text-lg leading-7">{resolvedTitle}</p>
						</div>
					)}
				</div>

				<div className="max-w-xl space-y-4">
					<p className="text-sm uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
						{t("about.sectionEyebrow")}
					</p>
					<Heading className="mb-2 text-4xl font-black tracking-[-0.05em] uppercase text-[color:var(--editorial-ink)] sm:text-5xl">
						{resolvedTitle}
					</Heading>
					<p className="leading-8 text-[color:var(--editorial-muted)]">{resolvedBody}</p>
					{resolvedExtended ? (
						<p className="leading-8 text-[color:var(--editorial-muted)]">{resolvedExtended}</p>
					) : null}
					{showReadMore && (
						<p className="mt-4">
							<YnsLink
								className="inline-flex h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-xs font-black uppercase tracking-[0.18em] text-[color:var(--editorial-paper)]"
								href="/about"
							>
								{t("about.sectionReadMore")}
							</YnsLink>
						</p>
					)}
				</div>
			</div>
		</section>
	);
}
