import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { getEditorialSarauPage } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { YnsLink } from "@/ui/yns-link";

export const dynamic = "force-dynamic";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("Selo");
	return {
		title: `Sarau Safado · ${seloSiteMeta.name}`,
		description: t("sarau.metadataDescription"),
	};
};

export default async function SarauSafadoPage() {
	const t = await getTranslations("Selo");
	const sarau = await getEditorialSarauPage();
	const notes = sarau.programNotes?.length
		? sarau.programNotes
		: [
				{
					title: "O Sarau Safado existe como ritual recorrente de leitura, presença e escuta.",
					body: "Em vez de um evento avulso, ele sustenta continuidade: cria público, prolonga o catálogo e abre espaço para vozes convidadas dentro de uma linha curatorial nítida.",
				},
				{
					title: "Origem",
					body: "O programa nasce da literatura erótica como campo de leitura e encontro, não como tema ornamental da marca.",
				},
				{
					title: "Continuidade",
					body: "Cada edição reforça a circulação entre livros, artistas convidadas, bibliotecas, instituições e leitoras recorrentes.",
				},
				{
					title: "Presença",
					body: "O sarau transforma leitura em acontecimento público e ajuda a dar corpo ao imaginário do selo fora da prateleira.",
				},
			];
	const continueLinks = sarau.continueLinks?.length
		? sarau.continueLinks
		: [
				{ label: t("sarau.linkEvents"), href: "/events" },
				{ label: t("sarau.linkProjects"), href: "/projects" },
				{ label: t("sarau.linkBooks"), href: "/products" },
			];

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<EditorialShell className="flex flex-1 flex-col gap-10 py-10">
				<section
					className="relative overflow-hidden border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)]"
					style={
						sarau.hero?.image?.src
							? {
									backgroundImage: `linear-gradient(120deg, rgba(247,244,239,0.62) 0%, rgba(247,244,239,0.2) 42%, rgba(11,11,11,0.58) 100%), url(${sarau.hero.image.src})`,
									backgroundPosition: "center",
									backgroundRepeat: "no-repeat",
									backgroundSize: "cover",
								}
							: undefined
					}
				>
					<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,244,239,0.08),rgba(247,244,239,0.16))]" />
					<div className="relative flex min-h-[440px] flex-col justify-between px-6 py-8 sm:min-h-[520px] sm:px-10 sm:py-10">
						<div className="max-w-3xl">
							<EditorialEyebrow className="sm:text-sm">
								{sarau.hero?.eyebrow || t("nav.sarau")}
							</EditorialEyebrow>
							<h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.06em] text-[color:var(--editorial-ink)] uppercase sm:text-6xl">
								{sarau.hero?.title || t("sarau.heroTitle")}
							</h1>
						</div>
						<div className="ml-auto max-w-xl border-l-[10px] border-[color:var(--editorial-accent)] bg-[color:rgba(247,244,239,0.9)] p-5 text-left">
							<p className="text-base leading-8 text-[color:var(--editorial-ink)] sm:text-lg">
								{sarau.hero?.body || t("sarau.heroBody")}
							</p>
							{sarau.hero?.image?.caption ? (
								<p className="mt-4 text-xs uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]">
									{sarau.hero.image.caption}
								</p>
							) : null}
						</div>
					</div>
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
					<EditorialPanel>
						<h2 className="editorial-serif text-3xl font-semibold">
							{sarau.why?.title || t("sarau.whyTitle")}
						</h2>
						<p className="mt-4 text-sm leading-7 text-[color:var(--editorial-muted)]">
							{sarau.why?.body || t("sarau.whyBody")}
						</p>
						{sarau.body ? (
							<p className="mt-4 text-sm leading-7 text-[color:var(--editorial-muted)]">{sarau.body}</p>
						) : null}
					</EditorialPanel>
					<EditorialPanel>
						<h2 className="editorial-serif text-3xl font-semibold">{t("sarau.signalsTitle")}</h2>
						<ul className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--editorial-muted)]">
							{(sarau.signals ?? []).map((detail) => (
								<li
									key={detail}
									className="border border-[color:var(--editorial-border)] bg-[color:rgba(247,244,239,0.72)] px-4 py-3"
								>
									{detail}
								</li>
							))}
						</ul>
					</EditorialPanel>
				</section>

				<section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
					<EditorialPanel className="border-l-[12px] border-l-[color:var(--editorial-accent)] bg-[color:var(--editorial-beige)]">
						<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
							Leitura do programa
						</p>
						<h2 className="mt-4 text-3xl leading-[0.95] font-black uppercase sm:text-4xl">
							{notes[0]?.title ||
								"O Sarau Safado existe como ritual recorrente de leitura, presença e escuta."}
						</h2>
						<p className="mt-4 text-sm leading-7 text-[color:var(--editorial-muted)]">
							{notes[0]?.body ||
								"Em vez de um evento avulso, ele sustenta continuidade: cria público, prolonga o catálogo e abre espaço para vozes convidadas dentro de uma linha curatorial nítida."}
						</p>
					</EditorialPanel>
					<div className="grid gap-4">
						{notes.slice(1, 4).map((note) => (
							<EditorialPanel key={note.title} className="p-5">
								<p className="text-xs uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]">
									{note.title}
								</p>
								<p className="mt-3 text-sm leading-7 text-[color:var(--editorial-muted)]">{note.body}</p>
							</EditorialPanel>
						))}
					</div>
				</section>

				<EditorialPanel className="bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] sm:p-8">
					<h2 className="text-3xl font-black uppercase">{t("sarau.continueTitle")}</h2>
					<p className="mt-3 max-w-2xl text-sm leading-7 text-[color:rgba(247,244,239,0.72)]">
						{t("sarau.continueBody")}
					</p>
					<div className="mt-6 flex flex-wrap gap-3">
						{continueLinks.map((link) => (
							<YnsLink
								key={link.href}
								href={link.href}
								className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/10"
							>
								{link.label}
							</YnsLink>
						))}
					</div>
				</EditorialPanel>
			</EditorialShell>
			<Footer />
		</div>
	);
}
