import { getTranslations } from "@/i18n/server";

export async function ProductNotFound({ query }: { query: string | undefined }) {
	const t = await getTranslations("/search.notFound");

	return (
		<section className="flex min-h-[24rem] flex-col items-center justify-center border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.38),transparent_42%),linear-gradient(180deg,#220607_0%,#050203_100%)] px-6 py-10 text-center text-primary-foreground">
			<div className="max-w-2xl space-y-4">
				<p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/48">Nenhum resultado</p>
				<h2 className="editorial-serif text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
					{t("title", { query })}
				</h2>
				<p className="max-w-xl text-pretty text-sm leading-8 text-primary-foreground/72 sm:text-base">
					{t("description")}
				</p>
			</div>
		</section>
	);
}
