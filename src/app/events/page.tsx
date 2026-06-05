import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { seloEvents, seloSiteMeta } from "@/lib/selolibertaria-content";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("Selo");
	return {
		title: `${t("events.heroEyebrow")} · ${seloSiteMeta.name}`,
		description: t("events.metadataDescription"),
	};
};

export default async function EventsPage() {
	const t = await getTranslations("Selo");
	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
				<header className="grid gap-6 border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.46),transparent_36%),linear-gradient(180deg,#220607_0%,#050203_100%)] p-8 text-primary-foreground lg:grid-cols-[1.35fr_0.9fr]">
					<div className="space-y-4">
						<p className="text-xs uppercase tracking-[0.32em] text-primary-foreground/58 sm:text-sm">
							{t("events.heroEyebrow")}
						</p>
						<h1 className="editorial-serif text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
							{t("events.heroTitle")}
						</h1>
						<p className="max-w-2xl text-sm leading-8 text-primary-foreground/78 sm:text-base">
							{t("events.heroBody")}
						</p>
					</div>
					<div className="border border-white/10 bg-black/25 p-6">
						<p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/48">
							{t("events.principleEyebrow")}
						</p>
						<p className="editorial-serif mt-3 text-2xl leading-tight font-medium text-primary-foreground">
							{t("events.principleTitle")}
						</p>
						<p className="mt-4 text-sm leading-7 text-primary-foreground/68">{t("events.principleBody")}</p>
					</div>
				</header>

				<section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
					<aside className="flex flex-col gap-6">
						<div className="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.38),transparent_42%),linear-gradient(180deg,#220607_0%,#050203_100%)] p-6 text-primary-foreground">
							<p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/52">
								{t("events.principleEyebrow")}
							</p>
							<p className="editorial-serif mt-4 text-3xl leading-tight font-semibold">
								{t("events.principleTitle")}
							</p>
							<p className="mt-4 text-sm leading-7 text-primary-foreground/72">{t("events.principleBody")}</p>
						</div>

						<div className="border border-border/60 bg-card/60 p-6 backdrop-blur supports-[backdrop-filter]:bg-card/70">
							<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
								Ritmo da programação
							</p>
							<ul className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground">
								<li className="border border-border/50 bg-background/60 px-4 py-3">
									Lançamentos, leituras e encontros devem aparecer lado a lado, sem separar artificialmente
									livro e presença pública.
								</li>
								<li className="border border-border/50 bg-background/60 px-4 py-3">
									O arquivo precisa mostrar continuidade curatorial, não apenas registro disperso.
								</li>
								<li className="border border-border/50 bg-background/60 px-4 py-3">
									Cada evento deve reforçar o catálogo como centro vivo do selo.
								</li>
							</ul>
						</div>
					</aside>

					<div className="grid gap-6">
						{seloEvents.map((event, index) => (
							<article
								key={event.slug}
								className="border border-border/60 bg-card/60 p-6 backdrop-blur supports-[backdrop-filter]:bg-card/70"
							>
								<div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
									<span>{event.status}</span>
									<span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
									<span>{event.period}</span>
									<span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
									<span>{event.location}</span>
								</div>
								<div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
									<div>
										<h2 className="editorial-serif text-3xl font-semibold sm:text-4xl">{event.title}</h2>
										<p className="mt-3 max-w-2xl text-base text-foreground/85">{event.summary}</p>
									</div>
									<p className="border-l border-border/60 pl-0 text-sm leading-7 text-muted-foreground lg:pl-5">
										{event.description}
									</p>
								</div>
								{index === 0 ? (
									<div className="mt-5 flex flex-wrap gap-3">
										<YnsLink
											href="/sarau-safado"
											className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
										>
											Conhecer o Sarau Safado
										</YnsLink>
										<YnsLink
											href="/projects"
											className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
										>
											Ver projetos relacionados
										</YnsLink>
									</div>
								) : null}
							</article>
						))}
					</div>
				</section>

				<section className="grid gap-6 border border-border/60 bg-background/70 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr]">
					<div>
						<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Continuidade</p>
						<h2 className="editorial-serif mt-4 text-3xl font-semibold sm:text-4xl">
							A agenda não termina no evento: ela abre caminho para livros, oficinas e arquivo.
						</h2>
					</div>
					<div className="flex flex-col gap-4 text-sm leading-7 text-muted-foreground">
						<p>
							Quem chega pela programação precisa encontrar uma transição clara entre encontro público,
							catálogo e contexto editorial.
						</p>
						<div className="flex flex-wrap gap-3">
							<YnsLink
								href="/products"
								className="rounded-full border border-border px-4 py-2 font-medium hover:bg-accent"
							>
								Ver livros
							</YnsLink>
							<YnsLink
								href="/contact"
								className="rounded-full border border-border px-4 py-2 font-medium hover:bg-accent"
							>
								Convidar o selo
							</YnsLink>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}
