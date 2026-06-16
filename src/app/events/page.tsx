import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import { listEditorialEvents } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
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
	const events = (await listEditorialEvents()).filter((event) => event.published);
	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<EditorialShell className="flex flex-1 flex-col gap-10 py-10">
				<header className="grid gap-6 border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] p-8 lg:grid-cols-[1.2fr_0.8fr]">
					<div className="space-y-4">
						<EditorialEyebrow className="sm:text-sm">{t("events.heroEyebrow")}</EditorialEyebrow>
						<h1 className="text-5xl font-black tracking-[-0.06em] uppercase sm:text-6xl">
							{t("events.heroTitle")}
						</h1>
						<p className="max-w-2xl text-sm leading-8 text-[color:var(--editorial-muted)] sm:text-base">
							{t("events.heroBody")}
						</p>
					</div>
					<div className="border-l-[10px] border-[color:var(--editorial-accent)] bg-[color:var(--editorial-beige)] p-6">
						<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
							{t("events.principleEyebrow")}
						</p>
						<p className="mt-3 text-2xl leading-tight font-black uppercase">{t("events.principleTitle")}</p>
						<p className="mt-4 text-sm leading-7 text-[color:var(--editorial-muted)]">
							{t("events.principleBody")}
						</p>
					</div>
				</header>

				<section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
					<aside className="flex flex-col gap-6">
						<EditorialPanel className="border-l-[12px] border-l-[color:var(--editorial-accent)] bg-[color:var(--editorial-beige)]">
							<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
								{t("events.principleEyebrow")}
							</p>
							<p className="mt-4 text-3xl leading-tight font-black uppercase">{t("events.principleTitle")}</p>
							<p className="mt-4 text-sm leading-7 text-[color:var(--editorial-muted)]">
								{t("events.principleBody")}
							</p>
						</EditorialPanel>

						<EditorialPanel className="p-6">
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
						</EditorialPanel>
					</aside>

					<div className="grid gap-6">
						{events.map((event, index) => (
							<EditorialPanel key={event.slug} className="p-6">
								{event.image?.src ? (
									<div className="relative mb-5 overflow-hidden border border-[color:var(--editorial-border)] bg-[color:var(--editorial-beige)]">
										<Image
											src={event.image.src}
											alt={event.image.alt || event.title}
											width={1600}
											height={900}
											className="h-auto w-full object-cover"
											sizes="(max-width: 1024px) 100vw, 960px"
										/>
									</div>
								) : null}
								<div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
									{event.eyebrow ? <span>{event.eyebrow}</span> : null}
									{event.eyebrow ? (
										<span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
									) : null}
									<span>{event.status}</span>
									<span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
									<span>{event.period}</span>
									<span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
									<span>{event.location}</span>
								</div>
								<div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
									<div>
										<h2 className="editorial-serif text-3xl font-semibold sm:text-4xl">{event.title}</h2>
										{event.summary ? (
											<p className="mt-3 max-w-2xl text-base text-foreground/85">{event.summary}</p>
										) : null}
									</div>
									{event.description ? (
										<p className="border-l border-border/60 pl-0 text-sm leading-7 text-muted-foreground lg:pl-5">
											{event.description}
										</p>
									) : null}
								</div>
								{index === 0 ? (
									<div className="mt-5 flex flex-wrap gap-3">
										<YnsLink
											href="/sarau-safado"
											className="border border-[color:var(--editorial-ink)] px-4 py-2 text-sm font-medium hover:bg-[color:var(--editorial-beige)]"
										>
											Conhecer o Sarau Safado
										</YnsLink>
										<YnsLink
											href="/projects"
											className="border border-[color:var(--editorial-ink)] px-4 py-2 text-sm font-medium hover:bg-[color:var(--editorial-beige)]"
										>
											Ver projetos relacionados
										</YnsLink>
									</div>
								) : null}
							</EditorialPanel>
						))}
					</div>
				</section>

				<section className="grid gap-6 border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-ink)] p-6 text-[color:var(--editorial-paper)] sm:p-8 lg:grid-cols-[1.15fr_0.85fr]">
					<div>
						<p className="text-xs uppercase tracking-[0.28em] text-[color:rgba(247,244,239,0.58)]">
							Continuidade
						</p>
						<h2 className="mt-4 text-3xl font-black uppercase sm:text-4xl">
							A agenda não termina no evento: ela abre caminho para livros, oficinas e arquivo.
						</h2>
					</div>
					<div className="flex flex-col gap-4 text-sm leading-7 text-[color:rgba(247,244,239,0.72)]">
						<p>
							Quem chega pela programação precisa encontrar uma transição clara entre encontro público,
							catálogo e contexto editorial.
						</p>
						<div className="flex flex-wrap gap-3">
							<YnsLink
								href="/products"
								className="border border-[color:rgba(247,244,239,0.22)] px-4 py-2 font-medium hover:bg-[color:rgba(247,244,239,0.08)]"
							>
								Ver livros
							</YnsLink>
							<YnsLink
								href="/contact"
								className="border border-[color:rgba(247,244,239,0.22)] px-4 py-2 font-medium hover:bg-[color:rgba(247,244,239,0.08)]"
							>
								Convidar o selo
							</YnsLink>
						</div>
					</div>
				</section>
			</EditorialShell>
			<Footer />
		</div>
	);
}
