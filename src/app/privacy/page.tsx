import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("/privacy.metadata");
	return {
		title: t("title"),
		description: t("description"),
	};
};

export default async function PrivacyPage() {
	const t = await getTranslations("/privacy.page");
	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />

			<main className="mx-auto w-full max-w-3xl p-8">
				<h1 className="text-3xl font-extrabold mb-4">{t("title")}</h1>
				<p className="mb-4 text-muted-foreground">{t("intro")}</p>
				<section className="space-y-4">
					<h2 className="text-xl font-semibold">{t("sections.collectedData.title")}</h2>
					<p>{t("sections.collectedData.body")}</p>

					<h2 className="text-xl font-semibold">{t("sections.useOfInformation.title")}</h2>
					<p>{t("sections.useOfInformation.body")}</p>

					<h2 className="text-xl font-semibold">{t("sections.contact.title")}</h2>
					<p>{t("sections.contact.body")}</p>
				</section>
			</main>

			<Footer />
		</div>
	);
}
