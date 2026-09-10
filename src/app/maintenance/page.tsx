import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "@/i18n/server";
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { MaintenanceCountdown } from "@/ui/maintenance/maintenance-countdown.client";
import { MaintenanceNotifyForm } from "@/ui/maintenance/maintenance-notify-form.client";
import { YnsLink } from "@/ui/yns-link";

/**
 * Next launch this screen counts down to. Imported from Claude Design:
 * "Em Construcao Little Fish Big Fish.dc.html" (defaults baked into that file).
 */
const LAUNCH_AT = "2026-11-06T19:00:00-03:00";
const LAUNCH_WINDOW = "6 de novembro de 2026";

const LINK_CLASS = "text-[10px] font-black uppercase tracking-[0.22em] text-[#F2891E] hover:text-[#E2461A]";

export default async function MaintenancePage() {
	if (!isMaintenanceModeEnabled()) {
		redirect("/");
	}

	const t = await getTranslations("Global.maintenance");

	return (
		<main
			data-screen-label="Em construção — little fish, big fish"
			className="relative box-border flex h-svh max-h-svh flex-col overflow-hidden bg-[#0B0B0B]"
		>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-[#0B0B0B]"
				style={{ animation: "sl-splash-veil 1.9s cubic-bezier(.7,0,.2,1) forwards" }}
			>
				<div
					className="h-14 w-14 rounded-full bg-[#F2891E]"
					style={{ animation: "sl-splash-mark 1.9s cubic-bezier(.7,0,.2,1) forwards" }}
				/>
			</div>

			<div
				aria-hidden
				className="pointer-events-none absolute -top-60 -left-[170px] h-[620px] w-[620px] rounded-full bg-[#F2891E] opacity-[0.13] blur-[28px]"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute -right-[130px] -bottom-[200px] h-[480px] w-[480px] rounded-full bg-[#E2461A] opacity-[0.13] blur-[28px]"
			/>

			<div
				className="relative flex flex-none items-center justify-between gap-6 border-b border-[color:rgba(247,244,239,0.12)] px-[clamp(24px,4vw,64px)] py-4"
				style={{ animation: "sl-settle-soft 2.5s ease-out both" }}
			>
				<div className="flex items-center gap-3">
					<div className="h-[34px] w-[34px] shrink-0 overflow-hidden border border-[color:rgba(247,244,239,0.3)]">
						<Image
							src="/images/selolibertaria.png"
							alt="Selo Libertária"
							width={34}
							height={34}
							className="h-full w-full object-cover"
						/>
					</div>
					<div>
						<div className="text-[9px] font-black tracking-[0.32em] text-[#F7F4EF] uppercase">Selo</div>
						<div className="text-[13px] font-black tracking-[0.26em] text-[#F7F4EF] uppercase">
							Libertária
						</div>
					</div>
				</div>
				<span className="text-[10px] font-black tracking-[0.2em] text-[color:rgba(247,244,239,0.5)] uppercase">
					{t("tagline")}
				</span>
			</div>

			<div className="relative box-border grid min-h-0 flex-1 grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center gap-[clamp(20px,4vw,56px)] px-[clamp(20px,4vw,64px)] py-[clamp(14px,2.4vh,40px)]">
				<div className="flex min-h-0 min-w-0 flex-col gap-[clamp(8px,1.5vh,18px)]">
					<p
						className="m-0 text-[11px] font-black tracking-[0.32em] text-[#F2891E] uppercase"
						style={{ animation: "sl-settle 2.25s cubic-bezier(.2,.8,.2,1) both" }}
					>
						{t("eyebrow")}
					</p>
					<h1
						className="editorial-serif m-0 text-[clamp(40px,5.2vw,80px)] leading-[0.86] font-black tracking-[-0.04em] text-[#F2891E]"
						style={{ animation: "sl-settle 2.4s cubic-bezier(.2,.8,.2,1) both" }}
					>
						little fish,
						<br />
						big fish
					</h1>
					<p
						className="m-0 text-[clamp(14px,1.2vw,17px)] tracking-[0.03em] text-[color:rgba(247,244,239,0.72)]"
						style={{ animation: "sl-settle 2.55s cubic-bezier(.2,.8,.2,1) both" }}
					>
						{t("byline")}
					</p>
					<p
						className="text-pretty m-0 max-w-[52ch] text-[clamp(12px,1.05vw,16px)] leading-[1.55] text-[color:rgba(247,244,239,0.78)]"
						style={{ animation: "sl-settle 2.7s cubic-bezier(.2,.8,.2,1) both" }}
					>
						{t("description")}
					</p>

					<div
						className="box-border flex flex-col gap-[clamp(7px,1.2vh,14px)] border border-[color:rgba(247,244,239,0.2)] p-[clamp(10px,1.8vh,22px)]"
						style={{ animation: "sl-settle 2.85s cubic-bezier(.2,.8,.2,1) both" }}
					>
						<p className="m-0 text-[10px] font-black tracking-[0.28em] text-[color:rgba(247,244,239,0.55)] uppercase">
							{t("countdownLabel")}
						</p>
						<MaintenanceCountdown
							launchAt={LAUNCH_AT}
							days={t("days")}
							hours={t("hours")}
							minutes={t("minutes")}
							seconds={t("seconds")}
						/>
						<p className="editorial-serif m-0 text-[12px] leading-[1.5] text-[color:rgba(247,244,239,0.6)]">
							{t("launchNote", { date: LAUNCH_WINDOW })}
						</p>
					</div>

					<div style={{ animation: "sl-settle 3s cubic-bezier(.2,.8,.2,1) both" }}>
						<MaintenanceNotifyForm
							placeholder={t("emailPlaceholder")}
							buttonLabel={t("notifyButton")}
							noSpamLabel={t("noSpam")}
						/>
					</div>
				</div>

				<div
					className="flex h-full min-w-0 flex-col justify-center gap-[14px] overflow-hidden"
					style={{ animation: "sl-settle 2.7s cubic-bezier(.2,.8,.2,1) both" }}
				>
					<div
						className="relative box-border min-h-0 flex-1 border border-[color:rgba(247,244,239,0.14)] bg-[#111] p-3"
						style={{ animation: "sl-drift 7s ease-in-out infinite" }}
					>
						<Image
							src="/images/selolibertaria/lfbf-fish-badge.png"
							alt={t("badgeAlt")}
							fill
							sizes="(min-width: 768px) 40vw, 90vw"
							className="object-contain"
						/>
					</div>
					<div className="flex flex-none flex-wrap gap-5">
						<a href={seloSiteMeta.instagram} target="_blank" rel="noreferrer" className={LINK_CLASS}>
							{t("instagramLink")}
						</a>
						<YnsLink href="/products" className={LINK_CLASS}>
							{t("otherBooksLink")}
						</YnsLink>
					</div>
				</div>
			</div>

			<div
				className="relative h-[clamp(48px,9vh,110px)] w-full flex-none overflow-hidden"
				style={{ animation: "sl-settle-soft 3.1s ease-out both" }}
			>
				<Image src="/images/selolibertaria/lfbf-fish-band.png" alt="" fill className="object-cover" />
			</div>
		</main>
	);
}
