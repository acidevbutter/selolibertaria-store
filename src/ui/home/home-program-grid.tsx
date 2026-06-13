import { getTranslations } from "@/i18n/server";
import { seloEvents, seloProjects } from "@/lib/selolibertaria-content";
import { YnsLink } from "@/ui/yns-link";

export async function HomeProgramGrid() {
	const t = await getTranslations("Selo");
	const featuredEvents = seloEvents.slice(0, 3);
	const featuredProjects = seloProjects.slice(0, 3);

	return (
		<section className="grid gap-6 lg:grid-cols-2">
			<article className="border border-border/60 bg-card/70 p-6 sm:p-8">
				<div className="space-y-2">
					<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground sm:text-sm">
						{t("home.agenda.eyebrow")}
					</p>
					<h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight">
						{t("home.agenda.title")}
					</h2>
				</div>

				<ul className="mt-8 space-y-4">
					{featuredEvents.map((event) => (
						<li key={event.slug} className="border-t border-border/50 pt-4 first:border-t-0 first:pt-0">
							<div className="space-y-2">
								<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
									{event.period} · {event.location}
								</p>
								<h3 className="text-xl font-medium tracking-tight">{event.title}</h3>
								<p className="text-sm leading-7 text-muted-foreground">{event.summary}</p>
								<YnsLink
									href="/events"
									className="inline-flex text-sm font-medium underline underline-offset-4"
								>
									{t("home.agenda.link")}
								</YnsLink>
							</div>
						</li>
					))}
				</ul>
			</article>

			<article className="border border-border/60 bg-card/70 p-6 sm:p-8">
				<div className="space-y-2">
					<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground sm:text-sm">
						{t("home.projects.eyebrow")}
					</p>
					<h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight">
						{t("home.projects.title")}
					</h2>
				</div>

				<ul className="mt-8 space-y-4">
					{featuredProjects.map((project) => (
						<li key={project.slug} className="border-t border-border/50 pt-4 first:border-t-0 first:pt-0">
							<div className="space-y-2">
								<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
									{project.period} · {project.location}
								</p>
								<h3 className="text-xl font-medium tracking-tight">{project.title}</h3>
								<p className="text-sm leading-7 text-muted-foreground">{project.summary}</p>
								<YnsLink
									href="/projects"
									className="inline-flex text-sm font-medium underline underline-offset-4"
								>
									{t("home.projects.link")}
								</YnsLink>
							</div>
						</li>
					))}
				</ul>
			</article>
		</section>
	);
}
