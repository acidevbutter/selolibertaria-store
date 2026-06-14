import { getTranslations } from "@/i18n/server";
import type { EditorialHomePage } from "@/lib/editorial-content";
import { EditorialEyebrow } from "@/ui/editorial/editorial-primitives";
import { YnsLink } from "@/ui/yns-link";

export async function HomeManifesto({ content }: { content?: EditorialHomePage["manifesto"] | null }) {
	const t = await getTranslations("Selo");
	const manifesto = content ?? null;

	return (
		<section className="border-t border-[color:var(--editorial-border)] px-0 py-10 sm:py-14">
			<div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
				<div className="space-y-5">
					<EditorialEyebrow>Manifesto</EditorialEyebrow>
					<p className="max-w-4xl text-balance text-4xl leading-[0.92] font-black tracking-[-0.06em] sm:text-6xl">
						{manifesto?.title || t("home.manifesto.title")}
					</p>
					<YnsLink
						href={manifesto?.linkHref || "/about"}
						className="inline-flex h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--editorial-paper)]"
					>
						{manifesto?.linkLabel || t("home.manifesto.link")}
					</YnsLink>
				</div>
				<p className="max-w-md text-pretty text-base leading-8 text-[color:var(--editorial-muted)]">
					{manifesto?.body || t("home.manifesto.body")}
				</p>
			</div>
		</section>
	);
}
