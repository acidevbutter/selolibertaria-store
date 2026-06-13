import { getTranslations } from "@/i18n/server";

export async function HomeTopBar() {
	const t = await getTranslations("Selo");
	return (
		<div className="border-b border-white/10 bg-[linear-gradient(90deg,rgba(185,28,28,0.98),rgba(69,10,10,0.98))] px-4 py-2 text-center text-[11px] uppercase tracking-[0.24em] text-primary-foreground/78 sm:text-xs">
			{t("home.topBar")}
		</div>
	);
}
