import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { ContactForm } from "@/ui/contact/contact-form.client";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("/contact.metadata");
	return {
		title: t("title"),
		description: t("description"),
	};
};

export default async function ContactPage() {
	const t = await getTranslations("/contact.page");
	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<main className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div
					className="pointer-events-none absolute inset-0 select-none opacity-40 [mask-image:radial-gradient(circle_at_center,white,transparent_70%)]"
					aria-hidden
				/>
				<header className="mb-10 flex flex-col gap-3">
					<h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
					<p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">{t("description")}</p>
				</header>
				<div className="grid gap-8 lg:grid-cols-3">
					<Card className="lg:col-span-2 backdrop-blur supports-[backdrop-filter]:bg-card/70">
						<CardHeader className="pb-4">
							<CardTitle className="text-base">{t("form.title")}</CardTitle>
							<CardDescription>{t("form.description")}</CardDescription>
						</CardHeader>
						<CardContent className="pt-2">
							<ContactForm />
						</CardContent>
					</Card>
					<div className="space-y-8">
						<Card className="backdrop-blur supports-[backdrop-filter]:bg-card/70">
							<CardHeader className="pb-4">
								<CardTitle className="text-base">{t("info.title")}</CardTitle>
								<CardDescription>{t("info.description")}</CardDescription>
							</CardHeader>
							<CardContent className="pt-2 text-sm">
								<ul className="space-y-2">
									<li>
										<span className="font-medium">{t("info.instagram")}</span>{" "}
										<YnsLink href="https://instagram.com/ratoeira77" target="_blank">
											@ratoeira77
										</YnsLink>
									</li>
									<li>
										<span className="font-medium">{t("info.support")}</span> {t("info.supportDescription")}
									</li>
								</ul>
							</CardContent>
						</Card>
						<Card className="backdrop-blur supports-[backdrop-filter]:bg-card/70">
							<CardHeader className="pb-4">
								<CardTitle className="text-base">{t("links.title")}</CardTitle>
								<CardDescription>{t("links.description")}</CardDescription>
							</CardHeader>
							<CardContent className="pt-2 text-sm">
								<ul className="space-y-1">
									<li>
										<YnsLink href="/faq">{t("links.faq")}</YnsLink>
									</li>
									<li>
										<YnsLink href="/terms">{t("links.terms")}</YnsLink>
									</li>
									<li>
										<YnsLink href="/privacy">{t("links.privacy")}</YnsLink>
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
