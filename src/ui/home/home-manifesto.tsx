import { getTranslations } from "@/i18n/server";
import type { EditorialHomePage } from "@/lib/editorial-content";
import { YnsLink } from "@/ui/yns-link";

export async function HomeManifesto({ content }: { content?: EditorialHomePage["manifesto"] | null }) {
	const t = await getTranslations("Selo");
	const manifesto = content ?? null;

	return (
		<section className="border border-border/60 bg-[linear-gradient(180deg,rgba(251,247,240,0.84),rgba(246,239,230,0.94))] px-6 py-10 text-foreground shadow-sm sm:px-8 sm:py-12 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(32,22,20,0.96),rgba(19,13,12,0.98))] dark:text-primary-foreground">
			<div className="mx-auto max-w-3xl space-y-5 text-center">
				<p className="editorial-serif text-balance text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
					{manifesto?.title || t("home.manifesto.title")}
				</p>
				<p className="text-pretty text-base leading-8 text-muted-foreground dark:text-primary-foreground/72">
					{manifesto?.body || t("home.manifesto.body")}
				</p>
				<YnsLink
					href={manifesto?.linkHref || "/about"}
					className="inline-flex text-sm font-medium underline underline-offset-4"
				>
					{manifesto?.linkLabel || t("home.manifesto.link")}
				</YnsLink>
			</div>
		</section>
	);
}
