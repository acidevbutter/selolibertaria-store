import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { AboutSection } from "@/ui/about-section";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("/about.metadata");
	return {
		title: t("title"),
		description: t("description"),
	};
};

export default async function AboutPage() {
	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<main className="mx-auto w-full max-w-7xl p-0">
				<AboutSection headingTag="h1" showReadMore={false} imageSrc="/images/ratoeira.jpeg" />
			</main>
			<Footer />
		</div>
	);
}
