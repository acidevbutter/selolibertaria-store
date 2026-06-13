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
	const seloT = await getTranslations("Selo");
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
				<section className="overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.46),transparent_36%),linear-gradient(180deg,#220607_0%,#050203_100%)] px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
					<div className="max-w-4xl space-y-5">
						<p className="text-xs uppercase tracking-[0.32em] text-primary-foreground/58 sm:text-sm">
							{seloT("faq.eyebrow")}
						</p>
						<h1 className="editorial-serif max-w-4xl text-balance text-5xl leading-[0.95] font-semibold tracking-[-0.04em] sm:text-6xl">
							{t("title")}
						</h1>
						<p className="max-w-2xl text-base leading-8 text-primary-foreground/78 sm:text-lg">
							{seloT("faq.description")}
						</p>
					</div>
				</section>
				<section className="border border-border/60 bg-card/60 p-6 sm:p-8">
					<FaqAccordion items={faqs} />
				</section>
			</main>
			<Footer />
		</div>
	);
}
