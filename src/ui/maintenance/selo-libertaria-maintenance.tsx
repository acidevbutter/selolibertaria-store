import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import { PUBLIC_NAVIGATION } from "@/lib/public-navigation";
import { seloEditorialAssets, seloSiteMeta } from "@/lib/selolibertaria-content";
import { SeloLibertariaNotifyForm } from "@/ui/maintenance/selo-libertaria-notify-form.client";
import { SlChip } from "@/ui/sl/sl-chip";
import { YnsLink } from "@/ui/yns-link";

const LINK_CLASS = "text-[11px] font-black uppercase tracking-[0.22em]";

/**
 * Active /maintenance screen. Imported from Claude Design: "Em Construcao
 * Selo Libertaria.dc.html" (default illustration "Sereia" baked into that file).
 */
export async function SeloLibertariaMaintenance() {
	const t = await getTranslations("Global.maintenance");

	return (
		<main
			data-screen-label="Em construção — Selo Libertária"
			className="flex min-h-svh flex-col"
			style={{ background: "var(--sl-paper)", color: "var(--sl-ink)" }}
		>
			<header
				className="flex flex-none items-center justify-between gap-6 px-[clamp(16px,4vw,48px)] py-4"
				style={{ background: "var(--sl-ink)" }}
			>
				<div className="flex min-w-0 items-center gap-3">
					<div className="h-[34px] w-[34px] shrink-0 overflow-hidden border border-[color:rgba(247,244,239,0.2)]">
						<Image
							src="/images/selolibertaria.png"
							alt="Selo Libertária"
							width={34}
							height={34}
							className="h-full w-full object-cover"
						/>
					</div>
					<div className="min-w-0">
						<div className="text-[10px] font-black tracking-[0.32em] text-[color:rgba(247,244,239,0.55)] uppercase">
							Selo
						</div>
						<div className="text-[13px] font-black tracking-[0.26em] text-[#F7F4EF] uppercase">
							Libertária
						</div>
					</div>
				</div>
				<SlChip tone="buy" className="flex-none whitespace-nowrap">
					{t("badge")}
				</SlChip>
			</header>

			<div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-stretch">
				<section className="flex min-w-0 flex-col justify-center gap-[clamp(16px,2.4vh,28px)] px-[clamp(16px,4vw,48px)] py-[clamp(28px,5vw,72px)]">
					<p className="sl-eyebrow m-0" style={{ color: "var(--sl-accent)" }}>
						{t("kicker")}
					</p>
					<h1 className="sl-head m-0 text-[clamp(40px,6vw,76px)] leading-[0.9]">{t("title")}</h1>
					<p className="text-pretty m-0 max-w-[52ch] text-[clamp(15px,1.2vw,17px)] leading-[1.75] text-[color:var(--sl-text-muted)]">
						{t("message")}
					</p>

					<SeloLibertariaNotifyForm
						label={t("notifyLabel")}
						placeholder={t("emailPlaceholder")}
						buttonLabel={t("notifyButton")}
						noSpamLabel={t("noSpam")}
					/>

					<div
						className="flex flex-wrap gap-[clamp(14px,3vw,32px)] border-t pt-[clamp(6px,1.5vh,14px)]"
						style={{ borderColor: "var(--sl-line-hairline)" }}
					>
						<a
							href={seloSiteMeta.instagram}
							target="_blank"
							rel="noreferrer"
							className={`sl-link ${LINK_CLASS}`}
						>
							{t("instagramLink")}
						</a>
						<YnsLink href={PUBLIC_NAVIGATION.shop} className={`sl-link ${LINK_CLASS}`}>
							{t("catalogLink")}
						</YnsLink>
						<a href={`mailto:${seloSiteMeta.email}`} className={`sl-link ${LINK_CLASS}`}>
							{seloSiteMeta.email}
						</a>
					</div>
				</section>

				<section
					className="flex min-w-0 flex-col border-l"
					style={{ background: "var(--sl-sand)", borderColor: "var(--sl-line-hairline)" }}
				>
					<div className="flex min-h-[260px] flex-1 items-center justify-center p-[clamp(20px,4vw,56px)]">
						<Image
							src={seloEditorialAssets.illustrationMermaid}
							alt={t("illustrationAlt")}
							width={480}
							height={480}
							className="h-auto max-h-[46vh] w-auto max-w-full object-contain"
						/>
					</div>
					<div
						className="flex flex-none flex-wrap gap-[clamp(16px,3vw,28px)] px-[clamp(20px,4vw,56px)] py-[clamp(16px,2.4vw,28px)]"
						style={{ background: "var(--sl-ink)" }}
					>
						<div className="min-w-0">
							<div className="sl-price text-[clamp(22px,2.4vw,30px)] leading-none text-[#F7F4EF]">
								{t("statusLabel")}
							</div>
							<div className="mt-[6px] text-[10px] font-black tracking-[0.24em] text-[color:rgba(247,244,239,0.55)] uppercase">
								{t("statusCaption")}
							</div>
						</div>
					</div>
				</section>
			</div>

			<footer
				className="flex flex-none flex-wrap items-center justify-between gap-3 border-t px-[clamp(16px,4vw,48px)] py-3.5"
				style={{ borderColor: "var(--sl-line-hairline)" }}
			>
				<span className="text-[13px] text-[color:var(--sl-text-soft)]">{t("footerTagline")}</span>
				<span className="text-[10px] font-black tracking-[0.24em] text-[color:var(--sl-text-disabled)] uppercase">
					{t("footerNote")}
				</span>
			</footer>
		</main>
	);
}
