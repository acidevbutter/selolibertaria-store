import { getTranslations } from "@/i18n/server";
import { EditorialEyebrow, EditorialPanel } from "@/ui/editorial/editorial-primitives";
import { Reveal } from "@/ui/motion/reveal";
import { YnsLink } from "@/ui/yns-link";

export async function ProductNotFound({ query }: { query: string | undefined }) {
	const t = await getTranslations("/search.notFound");

	return (
		<Reveal>
			<EditorialPanel className="flex min-h-[24rem] flex-col items-center justify-center bg-[color:var(--editorial-beige)] px-6 py-10 text-center">
				<div className="max-w-2xl space-y-5">
					<EditorialEyebrow>Nenhum resultado</EditorialEyebrow>
					<h2 className="editorial-serif text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
						{t("title", { query })}
					</h2>
					<p className="mx-auto max-w-xl text-pretty text-sm leading-8 text-[color:var(--editorial-muted)] sm:text-base">
						{t("description")}
					</p>
					<div className="flex flex-wrap justify-center gap-3 pt-2">
						<YnsLink
							href="/products"
							className="inline-flex h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
						>
							Ver livros
						</YnsLink>
						<YnsLink
							href="/projects"
							className="inline-flex h-11 items-center justify-center border border-[color:var(--editorial-border)] px-5 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:var(--editorial-paper)]"
						>
							Ver projetos
						</YnsLink>
					</div>
				</div>
			</EditorialPanel>
		</Reveal>
	);
}
