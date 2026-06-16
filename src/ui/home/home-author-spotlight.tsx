import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import type { EditorialHomePage } from "@/lib/editorial-content";
import { EditorialEyebrow, EditorialPanel } from "@/ui/editorial/editorial-primitives";
import { YnsLink } from "@/ui/yns-link";

export async function HomeAuthorSpotlight({ content }: { content?: EditorialHomePage["author"] | null }) {
	const t = await getTranslations("Selo");
	const author = content ?? null;
	return (
		<EditorialPanel className="sm:p-8">
			<div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
				<div className="overflow-hidden border border-[color:var(--editorial-border)] bg-[color:rgba(216,208,196,0.22)]">
					{author?.image?.src ? (
						<Image
							src={author.image.src}
							alt={author.image.alt || author.title || t("home.author.title")}
							width={720}
							height={820}
							className="h-full min-h-[320px] w-full object-cover"
							sizes="(max-width: 1024px) 100vw, 520px"
						/>
					) : (
						<div className="flex min-h-[320px] items-center justify-center p-8 text-center text-[color:var(--editorial-muted)]">
							<p className="max-w-xs text-lg leading-7">{author?.title || t("home.author.title")}</p>
						</div>
					)}
				</div>

				<div className="max-w-2xl space-y-4">
					<EditorialEyebrow className="sm:text-sm">
						{author?.eyebrow || t("home.author.eyebrow")}
					</EditorialEyebrow>
					<h2 className="editorial-serif text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
						{author?.title || t("home.author.title")}
					</h2>
					<p className="text-base leading-8 text-[color:var(--editorial-muted)]">
						{author?.body || t("home.author.body")}
					</p>
					<p className="text-base leading-8 text-[color:var(--editorial-muted)]">
						{author?.secondaryBody || t("home.author.secondaryBody")}
					</p>
					<div className="flex flex-col gap-3 sm:flex-row">
						<YnsLink
							href={author?.primaryCtaHref || "/about"}
							className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"
						>
							{author?.primaryCtaLabel || t("home.author.primaryCta")}
						</YnsLink>
						<YnsLink
							href={author?.secondaryCtaHref || "/sarau-safado"}
							className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"
						>
							{author?.secondaryCtaLabel || t("home.author.secondaryCta")}
						</YnsLink>
					</div>
				</div>
			</div>
		</EditorialPanel>
	);
}
