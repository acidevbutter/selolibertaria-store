import type { Metadata } from "next";
import { getEditorialContactPage } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { getSupportEmailSetting } from "@/lib/settings-store";
import { ContactForm } from "@/ui/contact/contact-form.client";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";
import { Footer } from "@/ui/footer/footer";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { Nav } from "@/ui/nav/nav";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (): Promise<Metadata> => {
	const contact = await getEditorialContactPage();

	return {
		title: `${contact.hero?.eyebrow || "Contato"} · ${seloSiteMeta.name}`,
		description:
			contact.hero?.body ||
			"Um canal direto para falar com o selo, livros, projetos, imprensa e Sarau Safado.",
	};
};

export default async function ContactPage() {
	const [contact, supportEmail] = await Promise.all([getEditorialContactPage(), getSupportEmailSetting()]);

	const resolvedSupportEmail = supportEmail || seloSiteMeta.email;
	const directLinks = [
		{
			label: "Email",
			href: `mailto:${resolvedSupportEmail}`,
			text: resolvedSupportEmail,
		},
		{
			label: "Instagram",
			href: seloSiteMeta.instagram,
			text: "@selolibertaria",
		},
		{
			label: "YouTube",
			href: seloSiteMeta.youtube,
			text: "Selo Libertária",
		},
	];

	const subjects = contact.form?.subjects?.length
		? contact.form.subjects
		: ["Comprar livro", "Enviar manuscrito", "Projetos", "Sarau Safado", "Imprensa", "Outro"];

	const closingLinks = contact.paths?.links?.slice(0, 3) || [
		{ label: "Projetos", href: "/projects" },
		{ label: "Sarau Safado", href: "/sarau-safado" },
		{ label: "Livros", href: "/products" },
	];

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<div className="relative">
				<Reveal>
					<header className="mb-10 bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]">
						<EditorialShell className="grid grid-cols-[minmax(0,1fr)] gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
							<div className="min-w-0 max-w-4xl space-y-5">
								<EditorialEyebrow className="text-[color:rgba(247,244,239,0.72)] sm:text-sm">
									{contact.hero?.eyebrow || "Contato"}
								</EditorialEyebrow>
								<h1 className="display-font max-w-5xl text-balance text-5xl leading-[0.92] font-black tracking-[-0.06em] sm:text-6xl">
									{contact.hero?.title || "Convites, parcerias, imprensa, livros e Sarau Safado."}
								</h1>
								<EditorialRichText
									source={
										contact.hero?.body ||
										"Um canal direto para falar com o selo, comprar livros, enviar propostas ou acompanhar a programação."
									}
									className="max-w-2xl text-base leading-8 text-[color:rgba(247,244,239,0.82)] sm:text-lg"
								/>
							</div>
							<div className="ml-auto w-full max-w-sm bg-[color:var(--editorial-paper)] p-6 text-[color:var(--editorial-ink)]">
								<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-accent)]">
									Email
								</p>
								<p className="mt-4 text-3xl leading-tight font-black break-words">{resolvedSupportEmail}</p>
							</div>
						</EditorialShell>
					</header>
				</Reveal>

				<EditorialShell className="grid gap-8 py-10 lg:grid-cols-3">
					<Reveal>
						<EditorialPanel className="lg:col-span-2">
							<div className="pb-4">
								<h2 className="text-3xl font-black uppercase">
									{contact.form?.title || "Escreva para o selo"}
								</h2>
								<EditorialRichText
									source={
										contact.form?.description ||
										"Use o formulário para convites, imprensa, projetos, livros e assuntos editoriais."
									}
									className="mt-2 text-sm leading-7 text-[color:var(--editorial-muted)]"
								/>
							</div>
							<div className="pt-2">
								<ContactForm subjectSuggestions={subjects} />
							</div>
						</EditorialPanel>
					</Reveal>

					<div className="space-y-8">
						<Reveal delay={0.08}>
							<LiftOnHover>
								<EditorialPanel className="bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]">
									<div className="pb-4">
										<h2 className="text-3xl font-black">Assuntos de contato</h2>
										<p className="mt-2 text-sm leading-7 text-[color:rgba(247,244,239,0.72)]">
											Caminhos recorrentes para livros, manuscritos, projetos, Sarau Safado e imprensa.
										</p>
									</div>
									<div className="pt-2 text-sm">
										<ul className="space-y-3">
											{subjects.map((label) => (
												<li key={label} className="border-b border-white/15 pb-3 last:border-b-0 last:pb-0">
													<span className="text-xl font-semibold">{label}</span>
												</li>
											))}
										</ul>
									</div>
								</EditorialPanel>
							</LiftOnHover>
						</Reveal>

						<Reveal delay={0.14}>
							<LiftOnHover>
								<EditorialPanel className="bg-[color:var(--editorial-beige)]">
									<div className="pb-4">
										<h2 className="text-3xl font-black uppercase">
											{contact.direct?.title || "Canais diretos"}
										</h2>
										<EditorialRichText
											source={
												contact.direct?.description ||
												"Fale com o selo pelos principais pontos de contato editoriais e sociais."
											}
											className="mt-2 text-sm leading-7 text-[color:var(--editorial-muted)]"
										/>
									</div>
									<div className="pt-2 text-sm">
										<ul className="space-y-2">
											{directLinks.map((link) => (
												<li
													key={`${link.label}-${link.href}`}
													className="border-b border-border/40 pb-2 last:border-b-0 last:pb-0"
												>
													<span className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
														{link.label}
													</span>
													<div className="mt-1">
														<YnsLink
															href={link.href}
															target={link.href.startsWith("http") ? "_blank" : undefined}
															rel={link.href.startsWith("http") ? "noreferrer" : undefined}
														>
															{link.text ?? link.label}
														</YnsLink>
													</div>
												</li>
											))}
										</ul>
									</div>
								</EditorialPanel>
							</LiftOnHover>
						</Reveal>
					</div>
				</EditorialShell>

				<Reveal>
					<section className="bg-[color:rgba(216,208,196,0.62)]">
						<EditorialShell className="grid gap-6 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
							<div>
								{contact.paths?.title ? (
									<p className="text-xs uppercase tracking-[0.22em] text-[color:var(--editorial-accent)]">
										{contact.paths.title}
									</p>
								) : null}
								<h2 className="max-w-3xl text-3xl leading-[1.02] font-black sm:text-4xl">
									{contact.closing?.title || "Continue pelo Instagram, newsletter ou agenda do Sarau."}
								</h2>
								<EditorialRichText
									source={
										contact.paths?.description ||
										"Navegue rapidamente entre catálogo, programação e páginas institucionais."
									}
									className="mt-3 text-sm leading-7 text-[color:var(--editorial-muted)]"
								/>
							</div>
							<div className="flex flex-wrap gap-3 lg:justify-end">
								{closingLinks.map((link, index) => (
									<YnsLink
										key={`${link.label}-${link.href}`}
										href={link.href}
										className={
											index === 0
												? "inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
												: "inline-flex min-h-11 items-center justify-center border border-[color:var(--editorial-border)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-white/45"
										}
									>
										{link.label}
									</YnsLink>
								))}
							</div>
						</EditorialShell>
					</section>
				</Reveal>
			</div>
			<Footer />
		</div>
	);
}
