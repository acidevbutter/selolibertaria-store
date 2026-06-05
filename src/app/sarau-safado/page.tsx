import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { getEditorialSarauPage } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { YnsLink } from "@/ui/yns-link";

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
			<main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
				<section className="border border-red-950/80 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.4),transparent_46%),linear-gradient(180deg,#220607,#050203)] px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
					<p className="text-xs uppercase tracking-[0.32em] text-primary-foreground/65 sm:text-sm">
						{sarau.hero?.eyebrow || t("nav.sarau")}
					</p>
					<h1 className="editorial-serif mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
						{sarau.hero?.title || t("sarau.heroTitle")}
					</h1>
					<p className="mt-6 max-w-3xl text-base leading-8 text-primary-foreground/82">
						{sarau.hero?.body || t("sarau.heroBody")}
					</p>
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
					<article className="border border-border/60 bg-card/60 p-6">
						<h2 className="editorial-serif text-3xl font-semibold">
							{sarau.why?.title || t("sarau.whyTitle")}
						</h2>
						<p className="mt-4 text-sm leading-7 text-muted-foreground">
							{sarau.why?.body || t("sarau.whyBody")}
						</p>
						{sarau.body ? <p className="mt-4 text-sm leading-7 text-muted-foreground">{sarau.body}</p> : null}
					</article>
					<aside className="border border-border/60 bg-card/60 p-6">
						<h2 className="editorial-serif text-3xl font-semibold">{t("sarau.signalsTitle")}</h2>
						<ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
							{(sarau.signals ?? []).map((detail) => (
								<li key={detail} className="border border-border/50 bg-background/70 px-4 py-3">
									{detail}
								</li>
							))}
						</ul>
					</aside>
				</section>

				<section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
					<div className="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.38),transparent_42%),linear-gradient(180deg,#220607_0%,#050203_100%)] p-6 text-primary-foreground">
						<p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/48">
							Leitura do programa
						</p>
						<h2 className="editorial-serif mt-4 text-3xl font-semibold sm:text-4xl">
							{notes[0]?.title ||
								"O Sarau Safado existe como ritual recorrente de leitura, presença e escuta."}
						</h2>
						<p className="mt-4 text-sm leading-7 text-primary-foreground/72">
							{notes[0]?.body ||
								"Em vez de um evento avulso, ele sustenta continuidade: cria público, prolonga o catálogo e abre espaço para vozes convidadas dentro de uma linha curatorial nítida."}
						</p>
					</div>
					<div className="grid gap-4">
						{notes.slice(1, 4).map((note) => (
							<div key={note.title} className="border border-border/60 bg-card/60 p-5">
								<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{note.title}</p>
								<p className="mt-3 text-sm leading-7 text-muted-foreground">{note.body}</p>
							</div>
						))}
					</div>
				</section>

				<section className="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.38),transparent_42%),linear-gradient(180deg,#220607_0%,#050203_100%)] p-6 text-primary-foreground sm:p-8">
					<h2 className="editorial-serif text-3xl font-semibold">{t("sarau.continueTitle")}</h2>
					<p className="mt-3 max-w-2xl text-sm leading-7 text-primary-foreground/72">
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
				</section>
			</main>
			<Footer />
		</div>
	);
}
