import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { listEditorialProjects } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
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
	const projects = (await listEditorialProjects()).filter((project) => project.published);
	const axisKeys = ["projects.axes.1", "projects.axes.2", "projects.axes.3"] as const;

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<EditorialShell className="flex flex-1 flex-col gap-10 py-10">
				<header className="grid gap-6 border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] p-8 lg:grid-cols-[1.2fr_0.8fr]">
					<div className="space-y-4">
						<EditorialEyebrow className="sm:text-sm">{t("projects.heroEyebrow")}</EditorialEyebrow>
						<h1 className="text-5xl font-black tracking-[-0.06em] uppercase sm:text-6xl">
							{t("projects.heroTitle")}
						</h1>
						<p className="max-w-2xl text-sm leading-8 text-[color:var(--editorial-muted)] sm:text-base">
							{t("projects.heroBody")}
						</p>
					</div>
					<div className="border-l-[10px] border-[color:var(--editorial-accent)] bg-[color:var(--editorial-beige)] p-6">
						<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
							{t("projects.principleEyebrow")}
						</p>
						<p className="mt-3 text-2xl leading-tight font-black uppercase">{t("projects.principleTitle")}</p>
						<p className="mt-4 text-sm leading-7 text-[color:var(--editorial-muted)]">
							{t("projects.principleBody")}
						</p>
					</div>
				</header>

				<section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
					<aside className="flex flex-col gap-6">
						<EditorialPanel className="border-l-[12px] border-l-[color:var(--editorial-accent)] bg-[color:var(--editorial-beige)]">
							<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
								{t("projects.principleEyebrow")}
							</p>
							<p className="mt-4 text-3xl leading-tight font-black uppercase">
								{t("projects.principleTitle")}
							</p>
							<p className="mt-4 text-sm leading-7 text-[color:var(--editorial-muted)]">
								{t("projects.principleBody")}
							</p>
						</EditorialPanel>

						<EditorialPanel className="p-6">
							<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
								{t("projects.axesEyebrow")}
							</p>
							<ul className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground">
								{axisKeys.map((key) => (
									<li key={key} className="border border-border/50 bg-background/60 px-4 py-3">
										{t(key)}
									</li>
								))}
							</ul>
						</EditorialPanel>
					</aside>

					<div className="grid gap-6">
						{projects.map((project, index) => (
							<EditorialPanel key={project.slug} className="p-6">
								<div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
									<span>{project.period}</span>
									<span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
									<span>{project.location}</span>
								</div>
								<div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
									<div>
										<h2 className="editorial-serif text-3xl font-semibold sm:text-4xl">{project.title}</h2>
										<p className="mt-3 max-w-2xl text-base text-foreground/85">{project.summary}</p>
									</div>
									<p className="border-l border-border/60 pl-0 text-sm leading-7 text-muted-foreground lg:pl-5">
										{project.description}
									</p>
								</div>
								{index === 0 ? (
									<div className="mt-5 flex flex-wrap gap-3">
										<YnsLink
											href="/sarau-safado"
											className="border border-[color:var(--editorial-ink)] px-4 py-2 text-sm font-medium hover:bg-[color:var(--editorial-beige)]"
										>
											{t("projects.ctaSarau")}
										</YnsLink>
										<YnsLink
											href="/events"
											className="border border-[color:var(--editorial-ink)] px-4 py-2 text-sm font-medium hover:bg-[color:var(--editorial-beige)]"
										>
											{t("projects.ctaRelatedEvents")}
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
							{t("projects.continuityEyebrow")}
						</p>
						<h2 className="mt-4 text-3xl font-black uppercase sm:text-4xl">
							{t("projects.continuityTitle")}
						</h2>
					</div>
					<div className="flex flex-col gap-4 text-sm leading-7 text-[color:rgba(247,244,239,0.72)]">
						<p>{t("projects.continuityBody")}</p>
						<div className="flex flex-wrap gap-3">
							<YnsLink
								href="/events"
								className="border border-[color:rgba(247,244,239,0.22)] px-4 py-2 font-medium hover:bg-[color:rgba(247,244,239,0.08)]"
							>
								{t("projects.ctaEvents")}
							</YnsLink>
							<YnsLink
								href="/products"
								className="border border-[color:rgba(247,244,239,0.22)] px-4 py-2 font-medium hover:bg-[color:rgba(247,244,239,0.08)]"
							>
								{t("projects.ctaCatalog")}
							</YnsLink>
						</div>
					</div>
				</section>
			</EditorialShell>
			<Footer />
		</div>
	);
}
