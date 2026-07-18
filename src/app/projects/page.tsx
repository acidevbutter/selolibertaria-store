import type { Metadata } from "next";
import Image from "next/image";
import { getEditorialProjectsPage, listEditorialProjects } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";
import { Footer } from "@/ui/footer/footer";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { Nav } from "@/ui/nav/nav";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (): Promise<Metadata> => {
	const page = await getEditorialProjectsPage();

	return {
		title: `${page.hero?.eyebrow || "Projetos"} · ${seloSiteMeta.name}`,
		description: page.hero?.body || "Portfólio cultural do selo em diálogo com cidade, erotismo e escrita.",
	};
};

export default async function ProjectsPage() {
	const [page, projects] = await Promise.all([getEditorialProjectsPage(), listEditorialProjects()]);

	const publishedProjects = projects.filter((project) => project.published);
	const featuredProject = publishedProjects[0] ?? null;

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<div className="flex flex-1 flex-col">
				<Reveal>
					<header className="bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]">
						<EditorialShell className="grid gap-6 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-12">
							<div className="space-y-4">
								<EditorialEyebrow className="text-[color:rgba(247,244,239,0.72)] sm:text-sm">
									{page.hero?.eyebrow || "Projetos"}
								</EditorialEyebrow>
								<h1 className="display-font text-5xl font-black tracking-[-0.06em] sm:text-6xl">
									{page.hero?.title || "Uma atuação que atravessa livro, palco e formação."}
								</h1>
								<EditorialRichText
									source={
										page.hero?.body || "Portfólio cultural do selo em diálogo com cidade, erotismo e escrita."
									}
									className="max-w-2xl text-sm leading-8 text-[color:rgba(247,244,239,0.8)] sm:text-base"
								/>
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
									<div className="flex aspect-[1.05] items-center justify-center border border-white/20 px-6 text-center text-xs uppercase tracking-[0.28em] text-[color:rgba(247,244,239,0.72)]">
										{page.hero?.imageLabel || "Foto / performance / oficina"}
									</div>
								)}
							</div>
						</EditorialShell>
					</header>
				</Reveal>

				<EditorialShell className="grid gap-6 py-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
					<Reveal>
						<div className="space-y-5">
							<EditorialEyebrow>{page.listing?.label || "Portfólio cultural"}</EditorialEyebrow>
							<h2 className="max-w-3xl text-4xl leading-[0.95] font-black tracking-[-0.05em]">
								{page.curatorialNote?.title || "Projetos como extensão viva do catálogo."}
							</h2>
						</div>
					</Reveal>
					<Reveal delay={0.08}>
						<div className="space-y-5 text-base leading-8 text-[color:var(--editorial-ink)]">
							<EditorialRichText
								source={
									page.curatorialNote?.body ||
									"Esta página apresenta portfólio cultural sem virar uma lista homogênea de cards. Cada item precisa ter imagem, status, contexto e saída clara."
								}
							/>
							<EditorialRichText
								source={
									page.listing?.body ||
									"Os projetos seguem vindo dos registros publicados do acervo editorial do admin."
								}
								className="text-sm leading-7 text-[color:var(--editorial-muted)]"
							/>
						</div>
					</Reveal>
				</EditorialShell>

				<EditorialShell className="space-y-6 py-10">
					<div className="border-t border-[color:var(--editorial-border)] pt-8">
						<h2 className="text-3xl font-black tracking-[-0.04em] text-[color:var(--editorial-ink)]">
							{page.listing?.title || "Projetos publicados"}
						</h2>
					</div>

					{publishedProjects.length > 0 ? (
						<div className="grid gap-6 lg:grid-cols-3">
							{publishedProjects.map((project, index) => (
								<Reveal key={project.slug} delay={0.06 * index}>
									<LiftOnHover>
										<EditorialPanel className="flex h-full flex-col p-5">
											<div className="relative aspect-[1.05] overflow-hidden bg-[color:var(--editorial-beige)]">
												{project.image?.src ? (
													<Image
														src={project.image.src}
														alt={project.image.alt || project.title}
														fill
														className="object-cover transition-transform duration-700 hover:scale-[1.02]"
														sizes="(max-width: 1024px) 100vw, 420px"
													/>
												) : null}
											</div>
											<p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--editorial-accent)]">
												{[project.period, project.location].filter(Boolean).join(" · ") || "Projeto cultural"}
											</p>
											<h3 className="mt-3 text-3xl leading-[0.98] font-black tracking-[-0.04em]">
												{project.title}
											</h3>
											<EditorialRichText
												source={project.summary || project.description}
												className="mt-4 flex-1 text-sm leading-7 text-[color:var(--editorial-muted)]"
											/>
											<YnsLink
												href={`/projects#${project.slug}`}
												className="mt-6 inline-flex min-h-11 items-center justify-center border border-[color:var(--editorial-border)] px-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:rgba(216,208,196,0.24)]"
											>
												Ver detalhes
											</YnsLink>
										</EditorialPanel>
									</LiftOnHover>
								</Reveal>
							))}
						</div>
					) : (
						<div className="border border-dashed border-[color:var(--editorial-border)] bg-[color:rgba(247,244,239,0.6)] px-6 py-10 text-sm leading-7 text-[color:var(--editorial-muted)]">
							{page.listing?.emptyText ||
								"Os projetos publicados aparecerão aqui assim que forem cadastrados no admin editorial."}
						</div>
					)}
				</EditorialShell>

				<Reveal>
					<section className="bg-[color:var(--editorial-beige)]">
						<EditorialShell className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
							<div className="max-w-3xl">
								<h2 className="text-3xl leading-[0.95] font-black sm:text-4xl">
									{page.finalCta?.title || "Projetos conectam programação, livro e comunidade."}
								</h2>
							</div>
							<div className="flex flex-col gap-4 text-sm leading-7 text-[color:var(--editorial-ink)]">
								<EditorialRichText
									source={
										page.finalCta?.body ||
										"A página de projetos deve abrir saídas diretas para contato e Sarau Safado."
									}
								/>
								<div className="flex flex-wrap gap-3">
									<YnsLink
										href={page.finalCta?.primaryCtaHref || "/contact"}
										className="inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
									>
										{page.finalCta?.primaryCtaLabel || "Falar sobre projeto"}
									</YnsLink>
									<YnsLink
										href={page.finalCta?.secondaryCtaHref || "/sarau-safado"}
										className="inline-flex min-h-11 items-center justify-center border border-[color:var(--editorial-border)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:rgba(247,244,239,0.4)]"
									>
										{page.finalCta?.secondaryCtaLabel || "Ver Sarau Safado"}
									</YnsLink>
								</div>
							</div>
						</EditorialShell>
					</section>
				</Reveal>
			</div>
			<Footer />
		</div>
	);
}
