import type { Metadata } from "next";
import { blockList, blockText } from "@/lib/editorial-blocks-slots";
import { getEditorialContactPage } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { getSupportEmailSetting } from "@/lib/settings-store";
import { ContactForm } from "@/ui/contact/contact-form.client";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { SlBand, SlProse } from "@/ui/sl/sl-band";
import { SlButton } from "@/ui/sl/sl-button";
import { SlEyebrow } from "@/ui/sl/sl-section-head";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (): Promise<Metadata> => {
	const contact = await getEditorialContactPage();

	return {
		title: `${blockText(contact.contentDoc, "contact-hero-eyebrow") || contact.hero?.eyebrow || "Contato"} · ${seloSiteMeta.name}`,
		description:
			blockText(contact.contentDoc, "contact-hero-body") ||
			contact.hero?.body ||
			"Um canal direto para falar com o selo, livros, projetos, imprensa e Sarau Safado.",
	};
};

export default async function ContactPage() {
	const [contact, supportEmail] = await Promise.all([getEditorialContactPage(), getSupportEmailSetting()]);

	const resolvedSupportEmail = supportEmail || seloSiteMeta.email;
	const directLinks = [
		{ label: "Email", href: `mailto:${resolvedSupportEmail}`, text: resolvedSupportEmail },
		{ label: "Instagram", href: seloSiteMeta.instagram, text: "@selolibertaria" },
		{ label: "YouTube", href: seloSiteMeta.youtube, text: "Selo Libertária" },
	];

	const subjects =
		blockList(contact.contentDoc, "contact-form-subjects") ||
		(contact.form?.subjects?.length
			? contact.form.subjects
			: ["Comprar livro", "Enviar manuscrito", "Projetos", "Sarau Safado", "Imprensa", "Outro"]);

	const closingLinks = contact.paths?.links?.slice(0, 3) || [
		{ label: "Projetos", href: "/projects" },
		{ label: "Sarau Safado", href: "/sarau-safado" },
		{ label: "Loja", href: "/products" },
	];

	return (
		<div
			className="sl-scope flex min-h-full flex-1 flex-col"
			style={{ background: "var(--sl-surface-page)" }}
		>
			<Nav />
			<main className="flex flex-1 flex-col">
				{/* Hero — ink, with the paper email card */}
				<SlBand
					tone="ink"
					innerClassName="grid gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:items-end lg:px-12"
				>
					<div className="flex max-w-[52ch] flex-col gap-3.5">
						<SlEyebrow onInk>
							{blockText(contact.contentDoc, "contact-hero-eyebrow") || contact.hero?.eyebrow || "Contato"}
						</SlEyebrow>
						<h1 className="sl-head m-0 text-[clamp(38px,6vw,var(--sl-size-hero-md))] leading-[0.95]">
							{blockText(contact.contentDoc, "contact-hero-title") ||
								contact.hero?.title ||
								"Convites, parcerias, imprensa, livros e Sarau Safado"}
						</h1>
						<p className="m-0 max-w-[48ch] text-[var(--sl-size-lead)] leading-[1.75] text-[color:var(--sl-text-on-ink-muted)]">
							{blockText(contact.contentDoc, "contact-hero-body") ||
								contact.hero?.body ||
								"Um canal direto para falar com o selo, comprar livros, enviar propostas ou acompanhar a programação."}
						</p>
					</div>
					<div className="flex w-full max-w-[384px] flex-col gap-3.5 bg-[color:var(--sl-surface-page)] p-6 text-[color:var(--sl-text)] lg:justify-self-end">
						<p className="sl-lbl m-0 text-[color:var(--sl-accent)]">
							{blockText(contact.contentDoc, "contact-hero-featured-label") ||
								contact.hero?.featuredLabel ||
								"Email"}
						</p>
						<p className="sl-price m-0 text-[clamp(20px,4vw,28px)] leading-[1.15] break-words">
							{resolvedSupportEmail}
						</p>
						<p className="m-0 text-[var(--sl-size-meta-sm)] leading-[1.7] text-[color:var(--sl-text-soft)]">
							Resposta em até dois dias úteis.
						</p>
					</div>
				</SlBand>

				{/* Form + side panels */}
				<SlBand tone="paper" innerClassName="flex flex-wrap items-start gap-5 px-4 py-16 sm:px-8 lg:px-12">
					<div className="flex min-w-0 flex-[2_1_420px] flex-col gap-6 border border-[color:var(--sl-line-hairline)] bg-[color:var(--sl-surface-card)] p-6">
						<div className="flex flex-col gap-2.5 border-b border-[color:var(--sl-line-hairline)] pb-5">
							<h2 className="sl-head m-0 text-[clamp(28px,4vw,var(--sl-size-section-sm))] leading-[0.98]">
								{blockText(contact.contentDoc, "contact-form-title") ||
									contact.form?.title ||
									"Escreva para o selo"}
							</h2>
							<SlProse
								source={
									blockText(contact.contentDoc, "contact-form-description") ||
									contact.form?.description ||
									"Use o formulário para convites, imprensa, projetos, livros e assuntos editoriais."
								}
								className="max-w-[60ch] text-[var(--sl-size-meta)] leading-[1.7] text-[color:var(--sl-text-muted)]"
							/>
						</div>
						<ContactForm subjectSuggestions={subjects} />
					</div>

					<div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
						<div
							className="flex flex-col gap-5 p-6 text-[color:var(--sl-text-on-ink)]"
							style={{ background: "var(--sl-surface-invert)" }}
						>
							<div className="flex flex-col gap-2.5 border-b border-[color:var(--sl-line-on-ink)] pb-4">
								<h2 className="sl-head m-0 text-[clamp(24px,3vw,36px)] leading-[1]">Assuntos de contato</h2>
								<p className="m-0 text-[var(--sl-size-meta)] leading-[1.7] text-[color:var(--sl-text-on-ink-muted)]">
									Caminhos recorrentes para livros, manuscritos, projetos, Sarau e imprensa.
								</p>
							</div>
							<ul className="m-0 flex list-none flex-col p-0">
								{subjects.map((label, index) => (
									<li
										key={label}
										className={
											index === subjects.length - 1
												? "py-3 text-[18px]"
												: "border-b border-[color:var(--sl-line-on-ink)] py-3 text-[18px]"
										}
									>
										{label}
									</li>
								))}
							</ul>
						</div>

						<div className="flex flex-col gap-5 p-6" style={{ background: "var(--sl-surface-band)" }}>
							<div className="flex flex-col gap-2.5 border-b border-[color:var(--sl-line)] pb-4">
								<h2 className="sl-head m-0 text-[clamp(24px,3vw,36px)] leading-[1]">
									{blockText(contact.contentDoc, "contact-direct-title") ||
										contact.direct?.title ||
										"Canais diretos"}
								</h2>
								<SlProse
									source={
										blockText(contact.contentDoc, "contact-direct-description") ||
										contact.direct?.description ||
										"Pontos de contato editoriais e sociais do selo."
									}
									className="text-[var(--sl-size-meta)] leading-[1.7] text-[color:var(--sl-text-muted)]"
								/>
							</div>
							<ul className="m-0 flex list-none flex-col gap-3.5 p-0">
								{directLinks.map((link, index) => (
									<li
										key={`${link.label}-${link.href}`}
										className={
											index === directLinks.length - 1
												? "flex flex-col gap-1"
												: "flex flex-col gap-1 border-b border-[color:var(--sl-line)] pb-3.5"
										}
									>
										<span className="sl-lbl m-0">{link.label}</span>
										<YnsLink
											href={link.href}
											target={link.href.startsWith("http") ? "_blank" : undefined}
											rel={link.href.startsWith("http") ? "noreferrer" : undefined}
											className="sl-link text-[var(--sl-size-body)]"
										>
											{link.text ?? link.label}
										</YnsLink>
									</li>
								))}
							</ul>
						</div>
						{blockText(contact.contentDoc, "contact-press-note") ? (
							<p className="m-0 border border-[color:var(--sl-line)] bg-[color:var(--sl-surface-card)] px-5 py-4 text-[var(--sl-size-meta)] leading-[1.7] text-[color:var(--sl-text-muted)]">
								{blockText(contact.contentDoc, "contact-press-note")}
							</p>
						) : null}
					</div>
				</SlBand>

				{/* Continue band — ink */}
				<SlBand
					tone="ink"
					innerClassName="grid gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:items-center lg:px-12"
				>
					<div className="flex flex-col gap-3">
						<p className="sl-eyebrow m-0 text-[color:var(--sl-text-on-ink-label)]">
							{blockText(contact.contentDoc, "contact-paths-title") || contact.paths?.title || "Continuar"}
						</p>
						<h2 className="sl-head m-0 max-w-[26ch] text-[clamp(26px,3.4vw,var(--sl-size-section-sm))] leading-[1]">
							{blockText(contact.contentDoc, "contact-closing-title") ||
								contact.closing?.title ||
								"Siga pela agenda do Sarau ou pelo catálogo"}
						</h2>
					</div>
					<div className="flex flex-wrap gap-3">
						{closingLinks.map((link, index) => (
							<SlButton
								key={`${link.label}-${link.href}`}
								href={link.href}
								variant={index === 0 ? "primary" : "secondary"}
								onInk={index !== 0}
								className={
									index === 0
										? "bg-[color:var(--sl-paper)] text-[color:var(--sl-ink)] hover:bg-[color:var(--sl-sand)]"
										: undefined
								}
							>
								{link.label}
							</SlButton>
						))}
					</div>
				</SlBand>
			</main>
			<Footer />
		</div>
	);
}
