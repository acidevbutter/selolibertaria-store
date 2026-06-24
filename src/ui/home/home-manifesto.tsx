import { getTranslations } from "@/i18n/server";
import type { EditorialHomePage } from "@/lib/editorial-content";
import { EditorialEyebrow, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { Reveal } from "@/ui/motion/reveal";
import { YnsLink } from "@/ui/yns-link";

export async function HomeManifesto({ content }: { content?: EditorialHomePage["manifesto"] | null }) {
	const t = await getTranslations("Selo");
	const manifesto = content ?? null;

	return (
		<section className="py-10 sm:py-14">
			<EditorialShell className="grid gap-8 border-t border-[color:var(--editorial-border)] pt-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-14">
				<Reveal>
					<div className="space-y-5">
						<EditorialEyebrow>Manifesto</EditorialEyebrow>
						<p className="display-font max-w-4xl text-balance text-4xl leading-[0.9] font-black tracking-[-0.06em] sm:text-6xl lg:text-[4.6rem]">
							{manifesto?.title || t("home.manifesto.title")}
						</p>
						<YnsLink
							href={manifesto?.linkHref || "/about"}
							className="inline-flex h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
						>
							{manifesto?.linkLabel || t("home.manifesto.link")}
						</YnsLink>
					</div>
				</Reveal>
				<Reveal delay={0.08}>
					<p className="max-w-lg pt-1 text-pretty text-base leading-8 text-[color:var(--editorial-muted)]">
						{manifesto?.body || t("home.manifesto.body")}
					</p>
				</Reveal>
			</EditorialShell>
		</section>
	);
}
