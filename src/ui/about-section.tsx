import Image from "next/image";
import type { ElementType } from "react";
import { getTranslations } from "@/i18n/server";
import { YnsLink } from "@/ui/yns-link";

type AboutSectionProps = {
	className?: string;
	showReadMore?: boolean;
	headingTag?: "h1" | "h2";
	imageSrc?: string;
};

export async function AboutSection({
	className,
	showReadMore = true,
	headingTag = "h2",
	imageSrc = "/images/ratoeira.jpeg",
}: AboutSectionProps) {
	const t = await getTranslations("/about.section");
	const Heading: ElementType = headingTag;

	return (
		<section className={className ?? "rounded bg-neutral-100 dark:bg-neutral-900 py-8 sm:py-12"}>
			<div className="mx-auto grid grid-cols-1 items-center gap-8 px-8 sm:px-16 md:grid-cols-2 max-w-7xl">
				<div className="flex justify-center md:justify-start">
					<Image
						src={imageSrc}
						alt="Ratoeira77"
						width={420}
						height={420}
						className="rounded"
						style={{ objectFit: "cover" }}
						priority={false}
					/>
				</div>

				<div className="max-w-md space-y-4">
					<Heading className="text-3xl font-extrabold mb-2 text-foreground grunge-font">{t("title")}</Heading>
					<p className="text-muted-foreground">{t("body")}</p>
					{showReadMore && (
						<p className="mt-4">
							<YnsLink className="underline" href="/about">
								{t("readMore")}
							</YnsLink>
						</p>
					)}
				</div>
			</div>
		</section>
	);
}
