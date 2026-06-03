import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { FaqAccordion } from "@/ui/faq/faq-accordion.client";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("/faq.metadata");
	return {
		title: t("title"),
		description: t("description"),
	};
};

export default async function FaqPage() {
	const t = await getTranslations("/faq.page");
	const faqs: { q: string; a: string }[] = [
		{
			q: t("items.payment.question"),
			a: t("items.payment.answer"),
		},
		{
			q: t("items.tracking.question"),
			a: t("items.tracking.answer"),
		},
		{
			q: t("items.customWork.question"),
			a: t("items.customWork.answer"),
		},
		{
			q: t("items.contact.question"),
			a: t("items.contact.answer"),
		},
	];

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
				<h1 className="text-2xl font-semibold tracking-tight mb-6">{t("title")}</h1>
				<FaqAccordion items={faqs} />
			</main>
			<Footer />
		</div>
	);
}
