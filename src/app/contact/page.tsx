import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { getEditorialContactPage } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { ContactForm } from "@/ui/contact/contact-form.client";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("Selo");
	return {
		title: `${t("contact.eyebrow")} · ${seloSiteMeta.name}`,
		description: t("contact.metadataDescription"),
	};
};

export default async function ContactPage() {
	const t = await getTranslations("Selo");
	const contact = await getEditorialContactPage();
	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<EditorialShell className="relative py-12">
				<header className="mb-10 overflow-hidden border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] px-6 py-10 sm:px-10 sm:py-14">
					<div className="max-w-4xl space-y-5">
						<EditorialEyebrow className="sm:text-sm">
							{contact.hero?.eyebrow || t("contact.eyebrow")}
						</EditorialEyebrow>
						<h1 className="max-w-4xl text-balance text-5xl leading-[0.92] font-black uppercase tracking-[-0.06em] sm:text-6xl">
							{contact.hero?.title || t("contact.title")}
						</h1>
						<p className="max-w-2xl text-base leading-8 text-[color:var(--editorial-muted)] sm:text-lg">
							{contact.hero?.body || t("contact.description")}
						</p>
					</div>
				</header>
				<div className="grid gap-8 lg:grid-cols-3">
					<EditorialPanel className="lg:col-span-2">
						<div className="pb-4">
							<h2 className="text-3xl font-black uppercase">
								{contact.form?.title || t("contact.formTitle")}
							</h2>
							<p className="mt-2 text-sm leading-7 text-[color:var(--editorial-muted)]">
								{contact.form?.description || t("contact.formDescription")}
							</p>
						</div>
						<div className="pt-2">
							<ContactForm />
						</div>
					</EditorialPanel>
					<div className="space-y-8">
						<EditorialPanel>
							<div className="pb-4">
								<h2 className="text-3xl font-black uppercase">
									{contact.direct?.title || t("contact.directTitle")}
								</h2>
								<p className="mt-2 text-sm leading-7 text-[color:var(--editorial-muted)]">
									{contact.direct?.description || t("contact.directDescription")}
								</p>
							</div>
							<div className="pt-2 text-sm">
								<ul className="space-y-3">
									{(
										contact.direct?.links ?? [
											{
												label: t("contact.emailLabel"),
												href: `mailto:${seloSiteMeta.email}`,
												text: seloSiteMeta.email,
											},
											{
												label: t("contact.instagramLabel"),
												href: seloSiteMeta.instagram,
												text: "@selolibertaria",
											},
											{
												label: t("contact.youtubeLabel"),
												href: seloSiteMeta.youtube,
												text: "Selo Libertaria",
											},
										]
									).map((link) => (
										<li
											key={`${link.label}-${link.href}`}
											className="border-b border-border/40 pb-3 last:border-b-0 last:pb-0"
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
													{link.text}
												</YnsLink>
											</div>
										</li>
									))}
								</ul>
							</div>
						</EditorialPanel>
						<EditorialPanel className="bg-[color:var(--editorial-beige)]">
							<div className="pb-4">
								<h2 className="text-3xl font-black uppercase">
									{contact.paths?.title || t("contact.pathsTitle")}
								</h2>
								<p className="mt-2 text-sm leading-7 text-[color:var(--editorial-muted)]">
									{contact.paths?.description || t("contact.pathsDescription")}
								</p>
							</div>
							<div className="pt-2 text-sm">
								<ul className="space-y-2">
									{(
										contact.paths?.links ?? [
											{ label: t("contact.linkProjects"), href: "/projects" },
											{ label: t("contact.linkEvents"), href: "/events" },
											{ label: t("contact.linkSarau"), href: "/sarau-safado" },
											{ label: t("contact.linkFaq"), href: "/faq" },
											{ label: t("contact.linkTerms"), href: "/terms" },
											{ label: t("contact.linkPrivacy"), href: "/privacy" },
										]
									).map((link) => (
										<li
											key={`${link.label}-${link.href}`}
											className="border-b border-border/40 pb-2 last:border-b-0 last:pb-0"
										>
											<YnsLink href={link.href}>{link.label}</YnsLink>
										</li>
									))}
								</ul>
							</div>
						</EditorialPanel>
					</div>
				</div>
			</EditorialShell>
			<Footer />
		</div>
	);
}
