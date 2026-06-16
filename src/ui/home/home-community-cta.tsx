import { getTranslations } from "@/i18n/server";
import type { EditorialHomePage } from "@/lib/editorial-content";
import { Newsletter } from "@/ui/footer/newsletter.client";
import { YnsLink } from "@/ui/yns-link";

export async function HomeCommunityCta({ content }: { content?: EditorialHomePage["community"] | null }) {
	const t = await getTranslations("Selo");
	const community = content ?? null;
	const secondaryLinks = community?.secondaryLinks ?? [];

	return (
		<section className="bg-[color:var(--editorial-ink)] px-8 py-10 text-[color:var(--editorial-paper)] sm:px-10">
			<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
				<div className="space-y-4">
					<h2 className="max-w-xl text-3xl leading-[0.95] font-black tracking-[-0.05em]">
						{community?.title || t("home.community.title")}
					</h2>
					{community?.body ? (
						<p className="max-w-xl text-sm leading-7 text-[color:rgba(247,244,239,0.72)]">{community.body}</p>
					) : null}
					{community?.primaryCtaLabel || community?.primaryCtaHref ? (
						<YnsLink
							href={community?.primaryCtaHref || "/contact"}
							className="inline-flex h-11 items-center justify-center border border-[color:rgba(247,244,239,0.22)] px-5 text-sm font-medium text-[color:var(--editorial-paper)] transition-colors hover:bg-[color:rgba(247,244,239,0.08)]"
						>
							{community?.primaryCtaLabel || t("home.community.primaryCta")}
						</YnsLink>
					) : null}
					{secondaryLinks.length ? (
						<div className="flex flex-wrap gap-3">
							{secondaryLinks.map((link) => (
								<YnsLink
									key={`${link.label}-${link.href}`}
									href={link.href}
									className="text-sm text-[color:rgba(247,244,239,0.72)] underline decoration-[color:rgba(247,244,239,0.3)] underline-offset-4 transition-colors hover:text-[color:var(--editorial-paper)]"
								>
									{link.label}
								</YnsLink>
							))}
						</div>
					) : null}
				</div>
				<div>
					<p className="sr-only">{t("home.community.mailingList")}</p>
					<Newsletter />
				</div>
			</div>
		</section>
	);
}
