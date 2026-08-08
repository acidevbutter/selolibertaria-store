import { getTranslations } from "@/i18n/server";
import {
	type EditorialHomePage,
	getEditorialBackgroundContrast,
	getEditorialBackgroundStyle,
} from "@/lib/editorial-content";
import { EditorialEyebrow, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";
import { Reveal } from "@/ui/motion/reveal";
import { YnsLink } from "@/ui/yns-link";

export async function HomeManifesto({ content }: { content?: EditorialHomePage["manifesto"] | null }) {
	const t = await getTranslations("Selo");
	const manifesto = content ?? null;
	const title =
		manifesto?.title ||
		// t("home.manifesto.title") ||
		"oi";
	const body = manifesto?.body || t("home.manifesto.body");
	const linkLabel = manifesto?.linkLabel || t("home.manifesto.link");
	const backgroundStyle = getEditorialBackgroundStyle(manifesto?.background, null, "medium");
	const useLightText =
		Boolean(backgroundStyle) && getEditorialBackgroundContrast(manifesto?.background, "dark") === "light";

	return (
		<section
			className={[
				"py-12 sm:py-16",
				useLightText
					? "bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]"
					: "bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)]",
			].join(" ")}
			style={backgroundStyle}
		>
			<EditorialShell className="grid gap-10 border-t border-[color:var(--editorial-border)] pt-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)] lg:items-start lg:gap-16">
				<Reveal>
					<div className="space-y-6">
						<EditorialEyebrow>Manifesto</EditorialEyebrow>
						<p
							className={[
								"title-font max-w-[16ch] text-balance text-[2.95rem] leading-[0.9] font-black tracking-[-0.06em] sm:text-[4.35rem] lg:text-[5.1rem]",
								useLightText ? "text-[color:var(--editorial-paper)]" : "text-[color:var(--editorial-ink)]",
							].join(" ")}
						>
							{title}
						</p>
						<YnsLink
							href={manifesto?.linkHref || "/about"}
							className={[
								"inline-flex h-11 items-center justify-center px-5 text-[10px] font-black uppercase tracking-[0.24em] transition-colors duration-300",
								useLightText
									? "bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)] hover:bg-[color:var(--editorial-beige)]"
									: "bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]",
							].join(" ")}
						>
							{linkLabel}
						</YnsLink>
					</div>
				</Reveal>
				<Reveal delay={0.08}>
					<div className="space-y-5 pt-1">
						<EditorialRichText
							source={body}
							className={[
								"max-w-[31rem] text-pretty text-base leading-8",
								useLightText ? "text-[color:rgba(247,244,239,0.78)]" : "text-[color:var(--editorial-muted)]",
							].join(" ")}
						/>
					</div>
				</Reveal>
			</EditorialShell>
		</section>
	);
}
