import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import { listEditorialProjects } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { Footer } from "@/ui/footer/footer";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
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
	const projects = (await listEditorialProjects()).filter((project) => project.published);
	const featuredProject = projects[0] ?? null;
	const axisKeys = ["projects.axes.1", "projects.axes.2", "projects.axes.3"] as const;

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<EditorialShell className="flex flex-1 flex-col gap-10 py-10">
				<Reveal>
					<header className="grid gap-6 bg-[color:var(--editorial-ink)] p-8 text-[color:var(--editorial-paper)] lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-12">
						<div className="space-y-4">
							<EditorialEyebrow className="text-[color:rgba(247,244,239,0.72)] sm:text-sm">
								{t("projects.heroEyebrow")}
							</EditorialEyebrow>
							<h1 className="display-font text-5xl font-black tracking-[-0.06em] sm:text-6xl">
								{t("projects.heroTitle")}
							</h1>
							<p className="max-w-2xl text-sm leading-8 text-[color:rgba(247,244,239,0.8)] sm:text-base">
								{t("projects.heroBody")}
							</p>
						</div>
						<div className="border border-white/30 bg-[color:rgba(247,244,239,0.12)] p-5">
							{featuredProject?.image?.src ? (
								<Image
									src={featuredProject.image.src}
									alt={featuredProject.image.alt || featuredProject.title}
									width={1200}
									height={900}
									className="h-auto w-full object-cover"
									sizes="(max-width: 1024px) 100vw, 460px"
								/>
							) : (
								<div className="flex aspect-[1.05] items-center justify-center border border-white/20 text-center text-xs uppercase tracking-[0.28em] text-[color:rgba(247,244,239,0.72)]">
									Foto / performance / oficina
								</div>
							)}
						</div>
					</header>
				</Reveal>

				<section className="grid gap-6 border-t border-[color:var(--editorial-border)] pt-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
					<Reveal>
						<div className="space-y-5">
							<h2 className="max-w-3xl text-4xl leading-[0.95] font-black tracking-[-0.05em]">
								Projetos como extensão viva do catálogo.
							</h2>
						</div>
					</Reveal>
					<Reveal delay={0.08}>
						<div className="space-y-5 text-base leading-8 text-[color:var(--editorial-ink)]">
							<p>
								Esta página apresenta portfólio cultural sem virar uma lista homogênea de cards. Cada item
								precisa ter imagem, status, contexto e saída clara.
							</p>
							<ul className="grid gap-3 text-sm leading-7 text-[color:var(--editorial-muted)]">
								{axisKeys.map((key) => (
									<li
										key={key}
										className="border border-[color:var(--editorial-border)] bg-background/60 px-4 py-3"
									>
										{t(key)}
									</li>
								))}
							</ul>
						</div>
					</Reveal>
				</section>

				<section className="grid gap-6 lg:grid-cols-3">
					{projects.map((project, index) => (
						<Reveal key={project.slug} delay={0.05 * index}>
							<LiftOnHover>
								<EditorialPanel
									className={
										index % 3 === 2
											? "group bg-[color:var(--editorial-ink)] p-5 text-[color:var(--editorial-paper)]"
											: "group p-5"
									}
								>
									{project.image?.src ? (
										<div className="relative mb-5 overflow-hidden border border-[color:var(--editorial-border)] bg-[color:var(--editorial-beige)]">
											<Image
												src={project.image.src}
												alt={project.image.alt || project.title}
												width={1600}
												height={900}
												className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
												sizes="(max-width: 1024px) 100vw, 960px"
											/>
										</div>
									) : null}
									<div
										className={
											index % 3 === 2
												? "flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-[color:rgba(247,244,239,0.72)]"
												: "flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground"
										}
									>
										{project.eyebrow ? <span>{project.eyebrow}</span> : null}
										{project.eyebrow ? (
											<span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
										) : null}
										<span>{project.period}</span>
										<span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
										<span>{project.location}</span>
									</div>
									<h2 className="mt-4 text-2xl leading-[0.98] font-black tracking-[-0.04em] sm:text-[2.15rem]">
										{project.title}
									</h2>
									{project.summary ? (
										<p
											className={
												index % 3 === 2
													? "mt-3 text-base text-[color:rgba(247,244,239,0.82)]"
													: "mt-3 text-base text-foreground/85"
											}
										>
											{project.summary}
										</p>
									) : null}
									{project.description ? (
										<p
											className={
												index % 3 === 2
													? "mt-4 text-sm leading-7 text-[color:rgba(247,244,239,0.72)]"
													: "mt-4 text-sm leading-7 text-muted-foreground"
											}
										>
											{project.description}
										</p>
									) : null}
								</EditorialPanel>
							</LiftOnHover>
						</Reveal>
					))}
				</section>

				<Reveal>
					<section className="grid gap-6 bg-[color:var(--editorial-beige)] p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
						<div className="max-w-3xl">
							<h2 className="text-3xl leading-[0.95] font-black sm:text-4xl">
								Projetos conectam programação, livro e comunidade.
							</h2>
						</div>
						<div className="flex flex-col gap-4 text-sm leading-7 text-[color:var(--editorial-ink)]">
							<p>{t("projects.continuityBody")}</p>
							<div className="flex flex-wrap gap-3">
								<YnsLink
									href="/contact"
									className="inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
								>
									Falar sobre projeto
								</YnsLink>
								<YnsLink
									href="/sarau-safado"
									className="inline-flex min-h-11 items-center justify-center border border-[color:var(--editorial-border)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:rgba(247,244,239,0.4)]"
								>
									Ver Sarau Safado
								</YnsLink>
							</div>
						</div>
					</section>
				</Reveal>
			</EditorialShell>
			<Footer />
		</div>
	);
}
