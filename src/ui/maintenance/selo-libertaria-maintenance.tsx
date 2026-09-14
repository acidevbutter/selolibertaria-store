import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import { SlChip } from "@/ui/sl/sl-chip";

/**
 * Active /maintenance screen. Imported from Claude Design: "Em Construcao
 * Selo Libertaria.dc.html", stripped down to a plain "Em manutenção" notice
 * while keeping the store's editorial header/typography identity.
 */
export async function SeloLibertariaMaintenance() {
	const t = await getTranslations("Global.maintenance");

	return (
		<main
			data-screen-label="Em manutenção — Selo Libertária"
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

			<div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
				<h1 className="sl-head m-0 text-[clamp(32px,6vw,64px)] leading-[0.95]">{t("title")}</h1>
			</div>
		</main>
	);
}
