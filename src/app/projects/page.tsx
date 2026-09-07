import type { Metadata } from "next";
import Image from "next/image";
import { getEditorialProjectsPage, listEditorialProjects } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { SlBand, SlProse } from "@/ui/sl/sl-band";
import { SlButton } from "@/ui/sl/sl-button";
import { SlChip } from "@/ui/sl/sl-chip";
import { SlEyebrow } from "@/ui/sl/sl-section-head";
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
		<div
			className="sl-scope flex min-h-full flex-1 flex-col"
			style={{ background: "var(--sl-surface-page)" }}
		>
			<Nav />
			<main className="flex flex-1 flex-col">
				{/* Hero — ink */}
				<SlBand
					tone="ink"
					innerClassName="grid gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:items-end lg:px-12"
				>
					<div className="flex max-w-[52ch] flex-col gap-3.5">
						<SlEyebrow onInk>{page.hero?.eyebrow || "Projetos"}</SlEyebrow>
						<h1 className="sl-head m-0 text-[clamp(38px,6vw,var(--sl-size-hero-md))] leading-[0.95]">
							{page.hero?.title || "Uma atuação que atravessa livro, palco e formação"}
						</h1>
						<p className="m-0 max-w-[48ch] text-[var(--sl-size-lead)] leading-[1.75] text-[color:var(--sl-text-on-ink-muted)]">
							{page.hero?.body ||
								"Portfólio cultural do selo em diálogo com cidade, erotismo e escrita — com imagem, status, contexto e saída clara em cada item."}
						</p>
					</div>
					<div className="border border-[color:var(--sl-line-on-ink)]">
						<div
							className="relative aspect-[4/3] overflow-hidden"
							style={{ background: "var(--sl-surface-desk)" }}
						>
							{featuredProject?.image?.src ? (
								<Image
									src={featuredProject.image.src}
									alt={featuredProject.image.alt || featuredProject.title}
									fill
									sizes="(max-width: 1024px) 100vw, 620px"
									className="object-cover"
								/>
							) : null}
						</div>
					</div>
				</SlBand>

				{/* Curatorial note — paper */}
				<SlBand
					tone="paper"
					innerClassName="grid gap-10 px-4 pb-10 pt-16 sm:px-8 lg:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] lg:items-start lg:px-12"
				>
					<div className="flex flex-col gap-4">
						<SlEyebrow>{page.listing?.label || "Portfólio cultural"}</SlEyebrow>
						<div className="border-b border-[color:var(--sl-line-hairline)] pb-5">
							<h2 className="sl-head m-0 max-w-[22ch] text-[clamp(28px,4vw,var(--sl-size-section))] leading-[0.98]">
								{page.curatorialNote?.title || "Projetos como atuação cultural do selo"}
							</h2>
						</div>
					</div>
					<div className="flex flex-col gap-4">
						<SlProse
							source={
								page.curatorialNote?.body ||
								"Esta página apresenta portfólio cultural sem virar uma lista homogênea de cards. Cada item tem imagem, período, local, status e uma saída específica."
							}
							className="text-[var(--sl-size-body)] leading-[1.7] text-[color:var(--sl-text-muted)]"
						/>
						<SlProse
							source={
								page.listing?.body ||
								"Os projetos seguem vindo dos registros publicados do acervo editorial do admin."
							}
							className="text-[var(--sl-size-meta)] leading-[1.7] text-[color:var(--sl-text-soft)]"
						/>
					</div>
				</SlBand>

				{/* Published projects — paper card grid */}
				<SlBand tone="paper" innerClassName="flex flex-col gap-6 px-4 pb-16 pt-0 sm:px-8 lg:px-12">
					<div className="flex flex-wrap items-end justify-between gap-4 border-b border-[color:var(--sl-line-hairline)] pb-5">
						<h2 className="sl-head m-0 text-[clamp(28px,4vw,var(--sl-size-section))] leading-[0.98]">
							{page.listing?.title || "Projetos publicados"}
						</h2>
						{publishedProjects.length > 0 ? (
							<SlChip>
								{publishedProjects.length} {publishedProjects.length === 1 ? "registro" : "registros"}
							</SlChip>
						) : null}
					</div>

					{publishedProjects.length > 0 ? (
						<ul className="m-0 grid list-none gap-[var(--sl-grid-gap)] p-0 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
							{publishedProjects.map((project) => (
								<li
									key={project.slug}
									className="flex flex-col border border-[color:var(--sl-line-hairline)] bg-[color:var(--sl-surface-card)] transition-colors hover:border-[color:var(--sl-ink)]"
								>
									<div
										className="relative aspect-square overflow-hidden"
										style={{ background: "var(--sl-surface-band)" }}
									>
										{project.image?.src ? (
											<Image
												src={project.image.src}
												alt={project.image.alt || project.title}
												fill
												sizes="(max-width: 768px) 100vw, 320px"
												className="object-cover"
											/>
										) : null}
									</div>
									<div className="flex flex-1 flex-col gap-2.5 p-5">
										<p className="sl-lbl m-0 text-[color:var(--sl-accent)]">
											{[project.period, project.location].filter(Boolean).join(" · ") || "Projeto cultural"}
										</p>
										<h3 className="sl-head m-0 text-[var(--sl-size-card-title)] leading-[1.05]">
											{project.title}
										</h3>
										<p className="m-0 flex-1 text-[var(--sl-size-meta-sm)] leading-[1.65] text-[color:var(--sl-text-muted)]">
											{project.summary || project.description}
										</p>
										<SlButton
											href={`/projects/${encodeURIComponent(project.slug)}`}
											variant="secondary"
											className="mt-1 self-start"
										>
											Ver projeto
										</SlButton>
									</div>
								</li>
							))}
						</ul>
					) : (
						<div className="border border-dashed border-[color:var(--sl-line-strong)] bg-[color:var(--sl-surface-card)] px-6 py-10 text-[var(--sl-size-meta)] leading-[1.7] text-[color:var(--sl-text-muted)]">
							{page.listing?.emptyText ||
								"Os projetos publicados aparecerão aqui assim que forem cadastrados no admin editorial."}
						</div>
					)}
				</SlBand>

				{/* Final CTA — sand */}
				<SlBand
					tone="sand"
					innerClassName="grid gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:items-center lg:px-12"
				>
					<h2 className="sl-head m-0 max-w-[26ch] text-[clamp(26px,3.4vw,var(--sl-size-section-sm))] leading-[1]">
						{page.finalCta?.title || "Projetos conectam criação, formação e comunidade"}
					</h2>
					<div className="flex flex-col gap-4">
						<SlProse
							source={
								page.finalCta?.body ||
								"Para propostas de curadoria, residência, oficina ou coedição, fale direto com o selo."
							}
							className="max-w-[44ch] text-[var(--sl-size-body)] leading-[1.7] text-[color:var(--sl-text-muted)]"
						/>
						<div className="flex flex-wrap gap-3">
							<SlButton href={page.finalCta?.primaryCtaHref || "/contact"} variant="primary">
								{page.finalCta?.primaryCtaLabel || "Falar sobre projeto"}
							</SlButton>
							<YnsLink
								href={page.finalCta?.secondaryCtaHref || "/sarau-safado"}
								className="sl-btn sl-btn-secondary"
							>
								{page.finalCta?.secondaryCtaLabel || "Ver Sarau Safado"}
							</YnsLink>
						</div>
					</div>
				</SlBand>
			</main>
			<Footer />
		</div>
	);
}
