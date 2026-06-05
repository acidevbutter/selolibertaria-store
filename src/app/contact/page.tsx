import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { ContactForm } from "@/ui/contact/contact-form.client";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/shadcn/card";
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
	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<main className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div
					className="pointer-events-none absolute inset-0 select-none opacity-40 [mask-image:radial-gradient(circle_at_center,white,transparent_70%)]"
					aria-hidden
				/>
				<header className="mb-10 overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.46),transparent_36%),linear-gradient(180deg,#220607_0%,#050203_100%)] px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
					<div className="max-w-4xl space-y-5">
						<p className="text-xs uppercase tracking-[0.32em] text-primary-foreground/58 sm:text-sm">
							{t("contact.eyebrow")}
						</p>
						<h1 className="editorial-serif max-w-4xl text-balance text-5xl leading-[0.95] font-semibold tracking-[-0.04em] sm:text-6xl">
							{t("contact.title")}
						</h1>
						<p className="max-w-2xl text-base leading-8 text-primary-foreground/78 sm:text-lg">
							{t("contact.description")}
						</p>
					</div>
				</header>
				<div className="grid gap-8 lg:grid-cols-3">
					<Card className="border-border/60 lg:col-span-2 backdrop-blur supports-[backdrop-filter]:bg-card/70">
						<CardHeader className="pb-4">
							<CardTitle className="editorial-serif text-3xl">{t("contact.formTitle")}</CardTitle>
							<CardDescription>{t("contact.formDescription")}</CardDescription>
						</CardHeader>
						<CardContent className="pt-2">
							<ContactForm />
						</CardContent>
					</Card>
					<div className="space-y-8">
						<Card className="border-border/60 backdrop-blur supports-[backdrop-filter]:bg-card/70">
							<CardHeader className="pb-4">
								<CardTitle className="editorial-serif text-3xl">{t("contact.directTitle")}</CardTitle>
								<CardDescription>{t("contact.directDescription")}</CardDescription>
							</CardHeader>
							<CardContent className="pt-2 text-sm">
								<ul className="space-y-3">
									<li className="border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
										<span className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
											{t("contact.emailLabel")}
										</span>
										<div className="mt-1">
											<YnsLink href={`mailto:${seloSiteMeta.email}`}>{seloSiteMeta.email}</YnsLink>
										</div>
									</li>
									<li className="border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
										<span className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
											{t("contact.instagramLabel")}
										</span>
										<div className="mt-1">
											<YnsLink href={seloSiteMeta.instagram} target="_blank" rel="noreferrer">
												@selolibertaria
											</YnsLink>
										</div>
									</li>
									<li className="border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
										<span className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
											{t("contact.youtubeLabel")}
										</span>
										<div className="mt-1">
											<YnsLink href={seloSiteMeta.youtube} target="_blank" rel="noreferrer">
												Selo Libertaria
											</YnsLink>
										</div>
									</li>
								</ul>
							</CardContent>
						</Card>
						<Card className="border-border/60 backdrop-blur supports-[backdrop-filter]:bg-card/70">
							<CardHeader className="pb-4">
								<CardTitle className="editorial-serif text-3xl">{t("contact.pathsTitle")}</CardTitle>
								<CardDescription>{t("contact.pathsDescription")}</CardDescription>
							</CardHeader>
							<CardContent className="pt-2 text-sm">
								<ul className="space-y-2">
									<li className="border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
										<YnsLink href="/projects">{t("contact.linkProjects")}</YnsLink>
									</li>
									<li className="border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
										<YnsLink href="/events">{t("contact.linkEvents")}</YnsLink>
									</li>
									<li className="border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
										<YnsLink href="/sarau-safado">{t("contact.linkSarau")}</YnsLink>
									</li>
									<li className="border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
										<YnsLink href="/faq">{t("contact.linkFaq")}</YnsLink>
									</li>
									<li className="border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
										<YnsLink href="/terms">{t("contact.linkTerms")}</YnsLink>
									</li>
									<li className="border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
										<YnsLink href="/privacy">{t("contact.linkPrivacy")}</YnsLink>
									</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
