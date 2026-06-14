import { getTranslations } from "@/i18n/server";
import type { EditorialHomePage } from "@/lib/editorial-content";
import { Newsletter } from "@/ui/footer/newsletter.client";

export async function HomeCommunityCta({ content }: { content?: EditorialHomePage["community"] | null }) {
	const t = await getTranslations("Selo");
	const community = content ?? null;

	return (
		<section className="bg-[color:var(--editorial-ink)] px-8 py-10 text-[color:var(--editorial-paper)] sm:px-10">
			<div className="grid gap-6 lg:grid-cols-[1fr_360px_120px] lg:items-center">
				<h2 className="max-w-xl text-3xl leading-[0.95] font-black tracking-[-0.05em]">
					{community?.title || "Receba lancamentos, textos e saraus."}
				</h2>
				<div className="lg:col-span-2">
					<p className="sr-only">{t("home.community.mailingList")}</p>
					<Newsletter />
				</div>
			</div>
		</section>
	);
}
