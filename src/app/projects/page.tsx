import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { seloProjects, seloSiteMeta } from "@/lib/selolibertaria-content";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("Selo");
	return {
		title: `${t("projects.heroEyebrow")} · ${seloSiteMeta.name}`,
		description: t("projects.metadataDescription"),
	};
};

export default async function ProjectsPage() {
	const t = await getTranslations("Selo");
	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
				<header className="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.42),transparent_42%),linear-gradient(180deg,#220607_0%,#050203_100%)] p-8 text-primary-foreground">
					<div className="max-w-3xl space-y-4">
						<p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/48">
							{t("projects.heroEyebrow")}
						</p>
						<h1 className="editorial-serif text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
							{t("projects.heroTitle")}
						</h1>
						<p className="text-sm leading-8 text-primary-foreground/72 sm:text-base">
							{t("projects.heroBody")}
						</p>
					</div>
				</header>

				<section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
					<div className="flex flex-col gap-6">
						<div className="border border-border/60 bg-card/60 p-6 backdrop-blur supports-[backdrop-filter]:bg-card/70">
							<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
								Como esses projetos operam
							</p>
							<p className="editorial-serif mt-4 text-3xl leading-tight font-semibold">
								O selo se expande quando livro, formação e presença pública se apoiam mutuamente.
							</p>
							<p className="mt-4 text-sm leading-7 text-muted-foreground">
								Esses projetos não funcionam como satélites soltos. Eles aprofundam o catálogo, ampliam a
								pesquisa e criam contexto para novas leituras.
							</p>
						</div>

						<div className="border border-border/60 bg-background/70 p-6">
							<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Eixos recorrentes</p>
							<ul className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground">
								<li className="border border-border/50 bg-card/60 px-4 py-3">
									Escrita erótica e poéticas dissidentes
								</li>
								<li className="border border-border/50 bg-card/60 px-4 py-3">
									Curadoria de leitura, performance e encontro
								</li>
								<li className="border border-border/50 bg-card/60 px-4 py-3">
									Parcerias com instituições e espaços culturais
								</li>
							</ul>
						</div>
					</div>

					<div className="grid gap-6">
						{seloProjects.map((project) => (
							<article
								key={project.slug}
								className="border border-border/60 bg-card/60 p-6 backdrop-blur supports-[backdrop-filter]:bg-card/70"
							>
								<div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
									<span>{project.period}</span>
									<span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
									<span>{project.location}</span>
								</div>
								<div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
									<div>
										<h2 className="editorial-serif text-3xl font-semibold sm:text-4xl">{project.title}</h2>
										<p className="mt-3 text-base text-foreground/85">{project.summary}</p>
									</div>
									<p className="border-l border-border/60 pl-0 text-sm leading-7 text-muted-foreground lg:pl-5">
										{project.description}
									</p>
								</div>
							</article>
						))}
					</div>
				</section>

				<section className="grid gap-6 border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.38),transparent_42%),linear-gradient(180deg,#220607_0%,#050203_100%)] p-6 text-primary-foreground sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
					<div>
						<p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/48">Percurso</p>
						<h2 className="editorial-serif mt-4 text-3xl font-semibold sm:text-4xl">
							Cada projeto ajuda a ler o catálogo como prática cultural, não só como coleção de títulos.
						</h2>
					</div>
					<div className="flex flex-col gap-4 text-sm leading-7 text-primary-foreground/72">
						<p>
							Entre formação, performance e programação institucional, o público encontra vários modos de
							entrar no universo do selo e retornar aos livros.
						</p>
						<div className="flex flex-wrap gap-3">
							<YnsLink
								href="/events"
								className="rounded-full border border-border px-4 py-2 font-medium hover:bg-accent"
							>
								Ver agenda
							</YnsLink>
							<YnsLink
								href="/products"
								className="rounded-full border border-border px-4 py-2 font-medium hover:bg-accent"
							>
								Explorar catálogo
							</YnsLink>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}
