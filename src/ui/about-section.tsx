import Image from "next/image";
import type { ElementType } from "react";
import { getTranslations } from "@/i18n/server";
import { seloAbout } from "@/lib/selolibertaria-content";
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
	imageSrc = seloAbout.imageSrc,
	imageAlt = seloAbout.imageAlt,
	title,
	body,
	extended,
}: AboutSectionProps) {
	const t = await getTranslations("Selo");
	const Heading: ElementType = headingTag;
	const resolvedTitle = title ?? seloAbout.title;
	const resolvedBody = body ?? seloAbout.body;
	const resolvedExtended = extended ?? null;

	return (
		<section
			className={
				className ??
				"rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_top,#2b1814,transparent_50%),linear-gradient(180deg,#1a1716,#0f0d0d)] py-10 text-primary-foreground sm:py-14"
			}
		>
			<div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-8 sm:px-16 md:grid-cols-2">
				<div className="flex justify-center md:justify-start">
					<Image
						src={imageSrc}
						alt={imageAlt}
						width={420}
						height={420}
						className="rounded-3xl border border-white/10 object-cover shadow-2xl"
						style={{ objectFit: "cover" }}
						priority={false}
					/>
				</div>

				<div className="max-w-xl space-y-4">
					<p className="text-sm uppercase tracking-[0.24em] text-primary-foreground/60">
						{t("about.sectionEyebrow")}
					</p>
					<Heading className="mb-2 text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
						{resolvedTitle}
					</Heading>
					<p className="leading-7 text-primary-foreground/80">{resolvedBody}</p>
					{resolvedExtended ? (
						<p className="leading-7 text-primary-foreground/72">{resolvedExtended}</p>
					) : null}
					{showReadMore && (
						<p className="mt-4">
							<YnsLink className="underline underline-offset-4" href="/about">
								{t("about.sectionReadMore")}
							</YnsLink>
						</p>
					)}
				</div>
			</div>
		</section>
	);
}
