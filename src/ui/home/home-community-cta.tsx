import { getTranslations } from "@/i18n/server";
import { seloHomeCommunityCta } from "@/lib/selolibertaria-content";
import { Newsletter } from "@/ui/footer/newsletter.client";
import { YnsLink } from "@/ui/yns-link";

export async function HomeCommunityCta() {
	const t = await getTranslations("Selo");
	return (
		<section className="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.4),transparent_42%),linear-gradient(180deg,#220607_0%,#050203_100%)] p-6 text-primary-foreground sm:p-8">
			<div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
				<div className="space-y-4">
					<h2 className="editorial-serif max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
						{t("home.community.title")}
					</h2>
					<p className="max-w-xl text-base leading-8 text-primary-foreground/72">
						{t("home.community.body")}
					</p>
					<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
						<YnsLink
							href={seloHomeCommunityCta.primaryCta.href}
							className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-5 text-sm font-medium text-black transition-colors hover:bg-red-500"
						>
							{t("home.community.primaryCta")}
						</YnsLink>
						{seloHomeCommunityCta.secondaryLinks.map((link) => (
							<YnsLink
								key={link.label}
								href={link.href}
								target="_blank"
								rel="noreferrer"
								className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-medium hover:bg-white/10"
							>
								{link.label}
							</YnsLink>
						))}
					</div>
				</div>

				<div className="space-y-3">
					<p className="text-xs uppercase tracking-[0.3em] text-primary-foreground/48 sm:text-sm">
						{t("home.community.mailingList")}
					</p>
					<Newsletter />
				</div>
			</div>
		</section>
	);
}
