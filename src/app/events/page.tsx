import type { Metadata } from "next";
import Image from "next/image";
import { getEditorialBackgroundContrast, getEditorialBackgroundStyle } from "@/lib/editorial-content";
import {
	getEditorialEventsPage,
	listEditorialEvents,
	listEditorialProjects,
} from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { EditorialEyebrow, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (): Promise<Metadata> => {
	const page = await getEditorialEventsPage();

	return {
		title: `${page.hero?.eyebrow || "Eventos"} · ${seloSiteMeta.name}`,
		description: page.hero?.body || "Agenda pública, arquivo e memória editorial do universo do selo.",
	};
};

function getEventCta(slug: string, index: number) {
	if (slug.includes("sarau")) {
		return { href: "/sarau-safado", label: "Ver Sarau Safado" };
	}

	if (index === 1) {
		return { href: "/projects", label: "Ver projetos" };
	}

	return { href: "/contact", label: "Falar com o selo" };
}

export default async function EventsPage() {
	const [events, projects, page] = await Promise.all([
		listEditorialEvents(),
		listEditorialProjects(),
		getEditorialEventsPage(),
	]);

	const publishedEvents = events.filter((event) => event.published);
	const publishedProjects = projects.filter((project) => project.published);
	const featuredEvent = publishedEvents[0] ?? null;
	const heroBackgroundStyle = getEditorialBackgroundStyle(page.hero?.background, null, "strong");
	const hasConfiguredHeroBackground = Boolean(heroBackgroundStyle);
	const useDarkHeroText =
		hasConfiguredHeroBackground && getEditorialBackgroundContrast(page.hero?.background) === "dark";
	const posterEvents = publishedEvents.slice(0, 2);
	const agendaEvents = publishedEvents.slice(0, 4);
	const sarauEvent =
		publishedEvents.find(
			(event) => event.slug.includes("sarau") || event.title.toLowerCase().includes("sarau"),
		) ?? null;
	const leadingProject = publishedProjects[0] ?? null;

	const archiveCards = [
		{
			title: sarauEvent?.title ?? "Sarau Safado",
			meta: sarauEvent?.summary || "Agenda, memória e leitura ao vivo em torno das literaturas eróticas.",
			href: "/sarau-safado",
			image: sarauEvent?.image ?? featuredEvent?.image ?? null,
		},
		{
			title: leadingProject?.title ?? "Projetos culturais",
			meta: leadingProject?.summary || "Projetos, oficinas e programas que ampliam a vida do catálogo.",
			href: "/projects",
			image: leadingProject?.image ?? null,
		},
	] as const;

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<main className="flex flex-1 flex-col">
				<section
					className={[
						"relative overflow-hidden",
						useDarkHeroText
							? "bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)]"
							: "bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]",
					].join(" ")}
					style={heroBackgroundStyle}
				>
					{!hasConfiguredHeroBackground && featuredEvent?.image?.src ? (
						<>
							<Image
								src={featuredEvent.image.src}
								alt={featuredEvent.image.alt || featuredEvent.title}
								fill
								className="object-cover"
								sizes="100vw"
								priority
							/>
							<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,11,11,0.92)_0%,rgba(11,11,11,0.86)_48%,rgba(11,11,11,0.72)_100%)]" />
						</>
					) : !hasConfiguredHeroBackground ? (
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(122,30,34,0.42),transparent_44%),linear-gradient(135deg,#0b0b0b_0%,#171312_100%)]" />
					) : null}

					<EditorialShell className="relative grid min-h-[620px] gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
						<div className="max-w-3xl space-y-6">
							<EditorialEyebrow
								className={
									useDarkHeroText
										? "text-[color:var(--editorial-accent)] sm:text-sm"
										: "text-[color:rgba(247,244,239,0.7)] sm:text-sm"
								}
							>
								{page.hero?.eyebrow || "Eventos"}
							</EditorialEyebrow>
							<h1 className="title-font text-5xl leading-[0.88] font-black tracking-[-0.06em] sm:text-6xl lg:text-7xl">
								{page.hero?.title || featuredEvent?.title || "Agenda pública"}
							</h1>
							<EditorialRichText
								source={
									page.hero?.body ||
									featuredEvent?.summary ||
									"Eventos, leituras e memória editorial em circulação pública."
								}
								className={[
									"max-w-2xl text-base leading-8",
									useDarkHeroText
										? "text-[color:var(--editorial-ink)]"
										: "text-[color:rgba(247,244,239,0.78)]",
								].join(" ")}
							/>
							<div className="flex flex-wrap gap-3 pt-2">
								<YnsLink
									href={page.hero?.primaryCtaHref || "/sarau-safado"}
									className={[
										"inline-flex min-h-12 items-center justify-center px-5 text-xs font-black uppercase tracking-[0.22em] transition-colors duration-300",
										useDarkHeroText
											? "bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]"
											: "bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)] hover:bg-[color:var(--editorial-beige)]",
									].join(" ")}
								>
									{page.hero?.primaryCtaLabel || "Ver próxima edição"}
								</YnsLink>
								<YnsLink
									href={page.hero?.secondaryCtaHref || "/projects"}
									className={[
										"inline-flex min-h-12 items-center justify-center border px-5 text-xs font-black uppercase tracking-[0.22em] transition-colors duration-300",
										useDarkHeroText
											? "border-[color:rgba(11,11,11,0.24)] text-[color:var(--editorial-ink)] hover:bg-[color:rgba(11,11,11,0.06)]"
											: "border-[color:rgba(247,244,239,0.22)] text-[color:var(--editorial-paper)] hover:bg-[color:rgba(247,244,239,0.08)]",
									].join(" ")}
								>
									{page.hero?.secondaryCtaLabel || "Conhecer projetos"}
								</YnsLink>
							</div>
						</div>

						<div className="grid justify-start gap-4 lg:justify-end">
							{posterEvents.map((event, index) => (
								<div
									key={event.slug}
									className="relative border border-white/18 bg-black/70 p-5 shadow-[0_0_0_1px_rgba(247,244,239,0.04)]"
									style={{ transform: index === 0 ? "translateX(0px)" : "translateX(56px)" }}
								>
									<div className="relative h-[280px] w-[220px] overflow-hidden bg-[color:rgba(247,244,239,0.08)]">
										{event.image?.src ? (
											<Image
												src={event.image.src}
												alt={event.image.alt || event.title}
												fill
												className="object-cover"
												sizes="220px"
											/>
										) : null}
									</div>
									<h2 className="mt-4 max-w-[220px] text-2xl leading-[1.02] font-black">{event.title}</h2>
									<p className="mt-3 max-w-[220px] text-xs leading-6 uppercase tracking-[0.2em] text-[color:rgba(247,244,239,0.62)]">
										{[event.status, event.period, event.location].filter(Boolean).join(" · ")}
									</p>
								</div>
							))}
						</div>
					</EditorialShell>
				</section>

				<EditorialShell className="py-16">
					<section className="grid gap-10 border-t border-[color:var(--editorial-border)] pt-10 lg:grid-cols-[0.95fr_0.75fr] lg:gap-16">
						<div>
							<h2 className="title-font max-w-3xl text-4xl leading-[0.92] font-black tracking-[-0.05em] text-[color:var(--editorial-ink)] sm:text-5xl">
								{page.curatorialNote?.title ||
									"A agenda pública aproxima livro, presença e continuidade curatorial."}
							</h2>
						</div>
						<div className="space-y-5 text-sm leading-8 text-[color:var(--editorial-muted)] sm:text-base">
							<EditorialRichText
								source={
									page.curatorialNote?.body ||
									"Leituras, oficinas e memória de arquivo aparecem no mesmo fluxo para apresentar a programação como parte central da atuação cultural."
								}
							/>
							<EditorialRichText
								source={
									page.agenda?.body ||
									"A agenda mistura próxima edição, programação e memória sem perder clareza operacional."
								}
							/>
						</div>
					</section>
				</EditorialShell>

				<EditorialShell className="py-4">
					<section className="space-y-6">
						<EditorialEyebrow>{page.agenda?.label || "Agenda"}</EditorialEyebrow>
						<div className="border-t border-[color:var(--editorial-border)]">
							{agendaEvents.length > 0 ? (
								agendaEvents.map((event, index) => {
									const cta = getEventCta(event.slug, index);

									return (
										<div
											key={event.slug}
											className="grid gap-5 border-b border-[color:var(--editorial-border)] py-7 lg:grid-cols-[160px_1fr_280px_180px] lg:items-center lg:gap-8"
										>
											<div className="text-2xl leading-none font-black tracking-[-0.04em] text-[color:var(--editorial-ink)]">
												{event.period || event.status || "Agenda"}
											</div>
											<div className="space-y-2">
												<p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
													{event.status || "Programação pública"}
												</p>
												<h3 className="editorial-serif text-2xl font-semibold text-[color:var(--editorial-ink)]">
													{event.title}
												</h3>
											</div>
											<div className="text-sm leading-7 text-[color:var(--editorial-muted)]">
												<p>{event.location || "São Paulo"}</p>
												<EditorialRichText
													source={
														event.summary || event.description || "Programação editorial em circulação."
													}
												/>
											</div>
											<div className="flex lg:justify-end">
												<YnsLink
													href={cta.href}
													className="inline-flex min-h-12 items-center justify-center border border-[color:var(--editorial-ink)] px-5 text-xs font-black uppercase tracking-[0.2em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:var(--editorial-beige)]"
												>
													{cta.label}
												</YnsLink>
											</div>
										</div>
									);
								})
							) : (
								<div className="border-b border-[color:var(--editorial-border)] py-10 text-sm leading-7 text-[color:var(--editorial-muted)]">
									{page.agenda?.emptyText ||
										"A agenda pública será atualizada em breve. Enquanto isso, você pode acompanhar o Sarau Safado, conhecer os projetos e falar com o selo."}
								</div>
							)}
						</div>
					</section>
				</EditorialShell>

				<section className="bg-[color:rgba(216,208,196,0.42)]">
					<EditorialShell className="grid gap-8 py-16 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
						<div className="space-y-4">
							<EditorialEyebrow>{page.archive?.label || "Arquivo e memória"}</EditorialEyebrow>
							<h2 className="title-font text-4xl leading-[0.92] font-black tracking-[-0.05em] text-[color:var(--editorial-ink)] sm:text-5xl">
								{page.archive?.title || "A programação também deixa rastro, repertório e retorno aos livros."}
							</h2>
							<EditorialRichText
								source={
									page.archive?.body ||
									"A agenda não termina na data. Ela também organiza memória, fotos, textos e continuidade para a atuação cultural."
								}
								className="text-sm leading-7 text-[color:var(--editorial-muted)]"
							/>
						</div>
						<div className="grid gap-6 lg:grid-cols-2">
							{archiveCards.map((card) => (
								<YnsLink
									key={card.href}
									href={card.href}
									className="group border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)] p-6 transition-colors duration-300 hover:bg-white"
								>
									<div className="relative h-48 overflow-hidden bg-[color:var(--editorial-beige)]">
										{card.image?.src ? (
											<Image
												src={card.image.src}
												alt={card.image.alt || card.title}
												fill
												className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
												sizes="(max-width: 1024px) 100vw, 420px"
											/>
										) : null}
									</div>
									<h3 className="mt-5 editorial-serif text-2xl font-semibold text-[color:var(--editorial-ink)]">
										{card.title}
									</h3>
									<EditorialRichText
										source={card.meta}
										className="mt-3 text-sm leading-7 text-[color:var(--editorial-muted)]"
									/>
								</YnsLink>
							))}
						</div>
					</EditorialShell>
				</section>

				<EditorialShell className="py-12">
					<section className="grid gap-6 bg-[color:var(--editorial-ink)] px-6 py-8 text-[color:var(--editorial-paper)] sm:px-8 sm:py-10 lg:grid-cols-[1.1fr_auto] lg:items-center">
						<div>
							<h2 className="title-font max-w-4xl text-3xl leading-[0.92] font-black tracking-[-0.05em] sm:text-4xl">
								{page.finalCta?.title || "A agenda abre caminho para encontros, livros e projetos do selo."}
							</h2>
							<EditorialRichText
								source={
									page.finalCta?.body ||
									"O caminho público segue para o programa central do selo e para o portfólio cultural."
								}
								className="mt-3 max-w-3xl text-sm leading-7 text-[color:rgba(247,244,239,0.72)]"
							/>
						</div>
						<div className="flex flex-wrap gap-3">
							<YnsLink
								href={page.finalCta?.primaryCtaHref || "/sarau-safado"}
								className="inline-flex min-h-12 items-center justify-center bg-[color:var(--editorial-paper)] px-5 text-xs font-black uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:var(--editorial-beige)]"
							>
								{page.finalCta?.primaryCtaLabel || "Ver Sarau Safado"}
							</YnsLink>
							<YnsLink
								href={page.finalCta?.secondaryCtaHref || "/projects"}
								className="inline-flex min-h-12 items-center justify-center border border-[color:rgba(247,244,239,0.22)] px-5 text-xs font-black uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:rgba(247,244,239,0.08)]"
							>
								{page.finalCta?.secondaryCtaLabel || "Ver projetos"}
							</YnsLink>
						</div>
					</section>
				</EditorialShell>
			</main>
			<Footer />
		</div>
	);
}
