import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
	getEditorialProjectRecordBySlug,
	getEditorialProjectsPage,
	listEditorialProjects,
} from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { SlBand, SlProse } from "@/ui/sl/sl-band";
import { SlButton } from "@/ui/sl/sl-button";
import { SlEyebrow } from "@/ui/sl/sl-section-head";
import { YnsLink } from "@/ui/yns-link";

export const dynamic = "force-dynamic";

type ProjectPageProps = { params: Promise<{ slug: string }> };

export const generateMetadata = async (props: ProjectPageProps): Promise<Metadata> => {
	const { slug } = await props.params;
	const project = await getEditorialProjectRecordBySlug(slug);

	if (!project || !project.published) {
		return { title: `Projeto não encontrado · ${seloSiteMeta.name}` };
	}

	return {
		title: `${project.title} · ${seloSiteMeta.name}`,
		description: project.summary || project.description || undefined,
	};
};

export default async function ProjectDetailPage(props: ProjectPageProps) {
	const { slug } = await props.params;
	const [project, allProjects, page] = await Promise.all([
		getEditorialProjectRecordBySlug(slug),
		listEditorialProjects(),
		getEditorialProjectsPage(),
	]);

	if (!project || !project.published) notFound();

	const meta = [project.period, project.location].filter(Boolean).join(" · ");
	const facts = [
		project.period ? { label: "Período", value: project.period } : null,
		project.location ? { label: "Local", value: project.location } : null,
		{ label: "Status", value: "Publicado" },
	].filter((fact): fact is { label: string; value: string } => Boolean(fact));

	const others = allProjects.filter((entry) => entry.published && entry.slug !== project.slug).slice(0, 3);

	return (
		<div
			className="sl-scope flex min-h-full flex-1 flex-col"
			style={{ background: "var(--sl-surface-page)" }}
		>
			<Nav />
			<main className="flex flex-1 flex-col">
				{/* Hero — ink */}
				<SlBand tone="ink" innerClassName="flex flex-col gap-9 px-4 pb-14 pt-8 sm:px-8 lg:px-12">
					<YnsLink
						href="/projects"
						className="sl-btn sl-btn-primary self-start bg-[color:var(--sl-paper)] text-[color:var(--sl-ink)] hover:bg-[color:var(--sl-red)] hover:text-[color:var(--sl-text-on-ink)]"
					>
						← Voltar para projetos
					</YnsLink>
					<div className="grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))] lg:items-end">
						<div className="flex max-w-[52ch] flex-col gap-3.5">
							{meta ? (
								<p className="sl-eyebrow m-0 text-[color:var(--sl-text-on-ink-label)]">{meta}</p>
							) : null}
							<h1 className="sl-head m-0 text-[clamp(38px,6vw,var(--sl-size-hero-md))] leading-[0.95]">
								{project.title}
							</h1>
							{project.summary ? (
								<p className="m-0 max-w-[48ch] text-[var(--sl-size-lead)] leading-[1.75] text-[color:var(--sl-text-on-ink-muted)]">
									{project.summary}
								</p>
							) : null}
						</div>
						<div className="border border-[color:var(--sl-line-on-ink)]">
							<div
								className="relative aspect-[4/3] overflow-hidden"
								style={{ background: "var(--sl-surface-desk)" }}
							>
								{project.image?.src ? (
									<Image
										src={project.image.src}
										alt={project.image.alt || project.title}
										fill
										sizes="(max-width: 1024px) 100vw, 620px"
										className="object-cover"
									/>
								) : null}
							</div>
						</div>
					</div>
				</SlBand>

				{/* O projeto — paper, body + facts */}
				<SlBand
					tone="paper"
					innerClassName="grid gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:items-start lg:px-12"
				>
					<div className="flex flex-col gap-6">
						<SlEyebrow>O projeto</SlEyebrow>
						<SlProse
							source={project.description || project.summary}
							className="max-w-[62ch] text-[var(--sl-size-lead)] leading-[1.8] text-[color:var(--sl-text-muted)]"
						/>
					</div>
					<div className="flex flex-col border-t border-[color:var(--sl-line-hairline)]">
						{facts.map((fact) => (
							<div
								key={fact.label}
								className="flex justify-between gap-4 border-b border-[color:var(--sl-line-hairline)] py-4"
							>
								<span className="sl-lbl m-0">{fact.label}</span>
								<span className="max-w-[24ch] text-right text-[var(--sl-size-body-sm)] leading-[1.4]">
									{fact.value}
								</span>
							</div>
						))}
					</div>
				</SlBand>

				{(project.gallery ?? []).filter((entry) => entry.src).length > 0 ? (
					<SlBand tone="paper" innerClassName="flex flex-col gap-6 px-4 pb-16 pt-0 sm:px-8 lg:px-12">
						<div className="border-b border-[color:var(--sl-line-hairline)] pb-5">
							<h2 className="sl-head m-0 text-[clamp(22px,2.6vw,32px)] leading-[1]">Registros</h2>
						</div>
						<ul className="m-0 grid list-none gap-[var(--sl-grid-gap)] p-0 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
							{(project.gallery ?? [])
								.filter((entry) => entry.src)
								.map((entry, index) => (
									<li key={`${entry.src}-${index}`} className="flex flex-col gap-2">
										<div
											className="relative aspect-[4/3] overflow-hidden border border-[color:var(--sl-line-hairline)]"
											style={{ background: "var(--sl-surface-band)" }}
										>
											<Image
												src={entry.src}
												alt={entry.alt || `${project.title} (${index + 1})`}
												fill
												sizes="(max-width: 768px) 100vw, 320px"
												className="object-cover"
											/>
										</div>
										{entry.caption || entry.credit ? (
											<p className="m-0 text-[11px] leading-[1.4] text-[color:var(--sl-text-soft)]">
												{entry.caption}
												{entry.caption && entry.credit ? " · " : null}
												{entry.credit}
											</p>
										) : null}
									</li>
								))}
						</ul>
					</SlBand>
				) : null}

				{/* Outros projetos — paper cards */}
				{others.length > 0 ? (
					<SlBand tone="paper" innerClassName="flex flex-col gap-6 px-4 pb-16 pt-0 sm:px-8 lg:px-12">
						<div className="border-b border-[color:var(--sl-line-hairline)] pb-5">
							<h2 className="sl-head m-0 text-[clamp(22px,2.6vw,32px)] leading-[1]">
								Outros projetos do selo
							</h2>
						</div>
						<ul className="m-0 grid list-none gap-[var(--sl-grid-gap)] p-0 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
							{others.map((entry) => (
								<li
									key={entry.slug}
									className="flex flex-col border border-[color:var(--sl-line-hairline)] bg-[color:var(--sl-surface-card)] transition-colors hover:border-[color:var(--sl-ink)]"
								>
									<div
										className="relative aspect-[16/10] overflow-hidden"
										style={{ background: "var(--sl-surface-band)" }}
									>
										{entry.image?.src ? (
											<Image
												src={entry.image.src}
												alt={entry.image.alt || entry.title}
												fill
												sizes="(max-width: 768px) 100vw, 260px"
												className="object-cover"
											/>
										) : null}
									</div>
									<div className="flex flex-1 flex-col gap-2.5 p-[18px]">
										<p className="sl-lbl m-0 text-[color:var(--sl-accent)]">
											{[entry.period, entry.location].filter(Boolean).join(" · ") || "Projeto"}
										</p>
										<h3 className="sl-head m-0 flex-1 text-[var(--sl-size-card-title-sm)] leading-[1.1]">
											{entry.title}
										</h3>
										<SlButton
											href={`/projects/${encodeURIComponent(entry.slug)}`}
											variant="secondary"
											className="mt-1 h-[var(--sl-h-small)] self-start px-4 text-[10px]"
										>
											Ver projeto
										</SlButton>
									</div>
								</li>
							))}
						</ul>
					</SlBand>
				) : null}

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
								{page.finalCta?.primaryCtaLabel || "Falar com o selo"}
							</SlButton>
							<YnsLink href="/projects" className="sl-btn sl-btn-secondary">
								Outros projetos
							</YnsLink>
						</div>
					</div>
				</SlBand>
			</main>
			<Footer />
		</div>
	);
}
