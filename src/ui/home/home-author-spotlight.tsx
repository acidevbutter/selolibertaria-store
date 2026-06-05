import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import { seloHomeAuthorSpotlight } from "@/lib/selolibertaria-content";
import { YnsLink } from "@/ui/yns-link";

export async function HomeAuthorSpotlight() {
	const t = await getTranslations("Selo");
	return (
		<section className="border border-border/60 bg-card/65 p-6 sm:p-8">
			<div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
				<div className="overflow-hidden border border-border/60 bg-muted">
					<Image
						src={seloHomeAuthorSpotlight.imageSrc}
						alt={seloHomeAuthorSpotlight.imageAlt}
						width={720}
						height={820}
						className="h-full min-h-[320px] w-full object-cover"
						sizes="(max-width: 1024px) 100vw, 520px"
					/>
				</div>

				<div className="max-w-2xl space-y-4">
					<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground sm:text-sm">
						{t("home.author.eyebrow")}
					</p>
					<h2 className="editorial-serif text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
						{t("home.author.title")}
					</h2>
					<p className="text-base leading-8 text-muted-foreground">{t("home.author.body")}</p>
					<p className="text-base leading-8 text-muted-foreground">{t("home.author.secondaryBody")}</p>
					<div className="flex flex-col gap-3 sm:flex-row">
						<YnsLink
							href={seloHomeAuthorSpotlight.primaryCta.href}
							className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"
						>
							{t("home.author.primaryCta")}
						</YnsLink>
						<YnsLink
							href={seloHomeAuthorSpotlight.secondaryCta.href}
							className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"
						>
							{t("home.author.secondaryCta")}
						</YnsLink>
					</div>
				</div>
			</div>
		</section>
	);
}
