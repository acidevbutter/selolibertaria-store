import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "@/i18n/server";
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode";

export default async function MaintenancePage() {
	if (!isMaintenanceModeEnabled()) {
		redirect("/");
	}

	const t = await getTranslations("Global.maintenance");

	return (
		<main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[color:var(--editorial-ink)] px-6 py-16 text-center text-[color:var(--editorial-paper)]">
			<Image
				src="/images/selolibertaria.png"
				alt="Selo Libertária"
				width={72}
				height={72}
				className="h-16 w-16 object-contain"
			/>
			<p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[color:rgba(247,244,239,0.7)]">
				{t("eyebrow")}
			</p>
			<h1 className="max-w-2xl text-5xl font-black tracking-[-0.05em] sm:text-6xl">{t("title")}</h1>
			<p className="max-w-md text-base leading-7 text-[color:rgba(247,244,239,0.7)]">{t("description")}</p>
		</main>
	);
}
