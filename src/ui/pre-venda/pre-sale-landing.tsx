import Image from "next/image";
import { SlAddToCart } from "@/components/sl-add-to-cart.client";
import { fillCampaignText, type PreSaleCampaign } from "@/lib/pre-sale";
import { YnsLink } from "@/ui/yns-link";

/** Botão "Comprar" real quando a campanha carrega um variantId (preço de
 * pré-venda já resolvido pelo backend); cai para um link comum sem isso. */
function BuyButton({
	campaign,
	className,
	children,
}: {
	campaign: PreSaleCampaign;
	className: string;
	children: React.ReactNode;
}) {
	if (campaign.variantId) {
		return (
			<SlAddToCart
				variantId={campaign.variantId}
				productInfo={
					campaign.productId
						? { id: campaign.productId, name: "little fish, big fish", images: [campaign.images.badge] }
						: undefined
				}
				redirectTo="/checkout"
				className={className}
			>
				{children}
			</SlAddToCart>
		);
	}
	return (
		<YnsLink href={campaign.buyHref} className={className}>
			{children}
		</YnsLink>
	);
}

/**
 * Tela de pré-venda — composição completa.
 * Importada de Claude Design: "Pre-venda Little Fish Big Fish.dc.html".
 *
 * Presentational: tudo vem de `campaign`. Os placeholders `{price}` /
 * `{launchWindow}` do design viram props tipadas. As ações (checkout real,
 * link de pagamento) estão especificadas em
 * `docs/prompts/pre-venda-01-landing.md`.
 */
export function PreSaleLanding({ campaign }: { campaign: PreSaleCampaign }) {
	const [titleLine1, titleLine2] = campaign.title.split("\n");
	const colophon = fillCampaignText(campaign.about.colophon, campaign);

	return (
		<div className="flex flex-col bg-[#0B0B0B] text-[color:#F7F4EF]">
			{/* Topo */}
			<div className="flex items-center justify-between gap-6 border-b border-[color:rgba(247,244,239,0.12)] bg-[#0B0B0B] px-6 py-5 sm:px-16">
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 shrink-0 overflow-hidden border border-[color:rgba(247,244,239,0.3)]">
						<Image
							src="/images/selolibertaria.png"
							alt="Selo Libertária"
							width={40}
							height={40}
							className="h-full w-full object-cover"
						/>
					</div>
					<div>
						<div className="text-[10px] font-black uppercase tracking-[0.32em]">Selo</div>
						<div className="text-sm font-black uppercase tracking-[0.26em]">Libertária</div>
					</div>
				</div>
				<YnsLink
					href={campaign.backHref}
					className="text-[11px] font-black uppercase tracking-[0.2em] text-[color:rgba(247,244,239,0.55)] hover:text-[color:#F2891E]"
				>
					Voltar para a loja
				</YnsLink>
			</div>

			{/* Hero */}
			<div className="grid items-center gap-14 bg-[#0B0B0B] px-6 pb-18 pt-22 sm:px-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
				<div className="flex max-w-[640px] flex-col gap-6">
					<p className="m-0 text-xs font-black uppercase tracking-[0.32em] text-[color:#F2891E]">
						{campaign.eyebrow}
					</p>
					<h1 className="editorial-serif m-0 text-[clamp(52px,6.4vw,96px)] font-black leading-[0.86] tracking-[-0.04em] text-[color:#F2891E]">
						{titleLine1}
						{titleLine2 ? (
							<>
								<br />
								{titleLine2}
							</>
						) : null}
					</h1>
					<p className="m-0 text-lg tracking-[0.03em] text-[color:rgba(247,244,239,0.72)]">
						{campaign.byline}
					</p>
					<p className="m-0 text-[17px] leading-[1.75] text-[color:rgba(247,244,239,0.78)]">
						{campaign.intro}
					</p>

					<div className="mt-2 flex flex-col gap-[18px] border border-[color:rgba(247,244,239,0.2)] p-7">
						<p className="m-0 text-[11px] font-black uppercase tracking-[0.28em] text-[color:rgba(247,244,239,0.55)]">
							Pré-venda
						</p>
						<p className="editorial-serif m-0 text-[40px] font-black text-[color:#F7F4EF]">
							{campaign.price}
						</p>
						<p className="m-0 text-[13px] leading-[1.6] text-[color:rgba(247,244,239,0.6)]">
							Lançamento: {campaign.launchWindow} · edição de pré-venda com condições especiais em breve.
						</p>
						<div className="flex flex-wrap gap-3">
							<BuyButton
								campaign={campaign}
								className="inline-flex h-12 items-center bg-[#F2891E] px-[26px] text-[11px] font-black uppercase tracking-[0.24em] text-[#0B0B0B]"
							>
								Comprar agora
							</BuyButton>
							<YnsLink
								href="#sobre-o-livro"
								className="inline-flex h-12 items-center border border-[color:rgba(247,244,239,0.3)] px-[26px] text-[11px] font-black uppercase tracking-[0.24em] text-[color:#F7F4EF]"
							>
								Ver detalhes do livro
							</YnsLink>
						</div>
						<p className="m-0 text-[11px] tracking-[0.08em] text-[color:rgba(247,244,239,0.4)]">
							{campaign.paymentNote}
						</p>
					</div>
				</div>

				<div className="border border-[color:rgba(247,244,239,0.14)] bg-[#111] p-4">
					<Image
						src={campaign.images.badge}
						alt="Detalhe da capa de little fish, big fish"
						width={295}
						height={220}
						className="h-auto w-full"
						priority
					/>
				</div>
			</div>

			{/* Faixa */}
			<div className="h-[190px] w-full overflow-hidden bg-[#0B0B0B]">
				<Image
					src={campaign.images.band}
					alt=""
					width={450}
					height={302}
					className="h-full w-full object-cover"
				/>
			</div>

			{/* Sobre o livro */}
			<div
				id="sobre-o-livro"
				className="grid items-start gap-16 bg-[#F7F4EF] px-6 py-24 text-[color:#0B0B0B] sm:px-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]"
			>
				<div className="flex flex-col gap-[18px] lg:sticky lg:top-6">
					<p className="m-0 text-[11px] font-black uppercase tracking-[0.32em] text-[color:rgba(11,11,11,0.5)]">
						{campaign.about.eyebrow}
					</p>
					<p className="editorial-serif m-0 text-[38px] font-black leading-[1.15] tracking-[-0.02em]">
						{campaign.about.lead}
					</p>
				</div>
				<div className="flex max-w-[640px] flex-col gap-5">
					{campaign.about.paragraphs.map((paragraph) => (
						<p key={paragraph} className="m-0 text-base leading-[1.9] text-[color:rgba(11,11,11,0.72)]">
							{paragraph}
						</p>
					))}
					<p className="m-0 text-sm italic text-[color:rgba(11,11,11,0.5)]">{colophon}</p>
				</div>
			</div>

			{/* Autora */}
			<div className="flex items-center gap-16 bg-[#0B0B0B] px-6 py-20 sm:px-16">
				<div className="flex max-w-[760px] flex-col gap-4">
					<p className="m-0 text-[11px] font-black uppercase tracking-[0.32em] text-[color:rgba(247,244,239,0.5)]">
						{campaign.author.eyebrow}
					</p>
					<h2 className="editorial-serif m-0 text-[48px] font-black uppercase tracking-[-0.03em] text-[color:#F7F4EF]">
						{campaign.author.name}
					</h2>
					<p className="m-0 text-base leading-[1.85] text-[color:rgba(247,244,239,0.68)]">
						{campaign.author.bio}
					</p>
					<YnsLink
						href={campaign.author.cta.href}
						className="text-[11px] font-black uppercase tracking-[0.22em] text-[color:#F2891E]"
					>
						{campaign.author.cta.label}
					</YnsLink>
				</div>
			</div>

			{/* Chamada final */}
			<div className="relative flex flex-col items-center gap-6 overflow-hidden bg-[#0B0B0B] px-6 py-28 text-center sm:px-16">
				<div className="pointer-events-none absolute -left-30 -top-40 h-[520px] w-[520px] rounded-full bg-[#F2891E] opacity-[0.14] blur-[20px]" />
				<div className="pointer-events-none absolute -bottom-35 -right-25 h-[420px] w-[420px] rounded-full bg-[#E2461A] opacity-[0.14] blur-[20px]" />
				<p className="relative m-0 text-[11px] font-black uppercase tracking-[0.32em] text-[color:#F2891E]">
					{campaign.closing.eyebrow}
				</p>
				<h2 className="editorial-serif relative m-0 max-w-[16ch] text-[clamp(34px,4.4vw,58px)] font-black leading-[1.05] tracking-[-0.03em] text-[color:#F7F4EF]">
					{campaign.closing.title}
				</h2>
				<BuyButton
					campaign={campaign}
					className="relative mt-2 inline-flex h-[52px] items-center bg-[#F2891E] px-8 text-xs font-black uppercase tracking-[0.24em] text-[#0B0B0B]"
				>
					{campaign.closing.cta.label}
				</BuyButton>
			</div>
		</div>
	);
}

/** Bloco A — banner full-bleed para reaproveitar em Home / categoria. */
export function PreSaleHeroBanner({ campaign }: { campaign: PreSaleCampaign }) {
	const [titleLine1, titleLine2] = campaign.title.split("\n");
	return (
		<div className="grid min-h-[280px] items-center overflow-hidden bg-[#0B0B0B] sm:grid-cols-[minmax(0,1fr)_minmax(280px,0.6fr)]">
			<div className="flex flex-col gap-4 px-14 py-12">
				<p className="m-0 text-[10px] font-black uppercase tracking-[0.3em] text-[color:#F2891E]">
					Pré-venda
				</p>
				<h3 className="editorial-serif m-0 text-[44px] font-black leading-[0.95] tracking-[-0.03em] text-[color:#F2891E]">
					{titleLine1}
					{titleLine2 ? (
						<>
							<br />
							{titleLine2}
						</>
					) : null}
				</h3>
				<BuyButton
					campaign={campaign}
					className="mt-[6px] inline-flex h-11 items-center self-start bg-[#F7F4EF] px-[22px] text-[10px] font-black uppercase tracking-[0.22em] text-[#0B0B0B]"
				>
					Comprar agora
				</BuyButton>
			</div>
			<div className="h-[280px] overflow-hidden">
				<Image
					src={campaign.images.band}
					alt=""
					width={450}
					height={302}
					className="h-full w-full object-cover [object-position:70%_center]"
				/>
			</div>
		</div>
	);
}

/** Bloco B — card de destaque para a grade de Home / catálogo. */
export function PreSaleHighlightCard({ campaign }: { campaign: PreSaleCampaign }) {
	return (
		<div className="flex w-[340px] max-w-full flex-col bg-[#0B0B0B]">
			<div className="aspect-[1.35] overflow-hidden">
				<Image
					src={campaign.images.circle}
					alt=""
					width={270}
					height={180}
					className="h-full w-full object-cover"
				/>
			</div>
			<div className="flex flex-col gap-3 p-6">
				<span className="self-start border border-[color:rgba(247,244,239,0.26)] px-[10px] py-[3px] text-[10px] uppercase tracking-[0.2em] text-[color:rgba(247,244,239,0.75)]">
					Pré-venda
				</span>
				<h4 className="editorial-serif m-0 text-[26px] font-black lowercase tracking-[-0.02em] text-[color:#F7F4EF]">
					little fish, big fish
				</h4>
				<p className="m-0 text-xs text-[color:rgba(247,244,239,0.55)]">{campaign.author.name}</p>
				<p className="editorial-serif m-0 mt-1 text-2xl font-black text-[color:#F2891E]">{campaign.price}</p>
				<div className="mt-[6px] flex gap-[10px]">
					<BuyButton
						campaign={campaign}
						className="inline-flex h-[42px] flex-1 items-center justify-center bg-[#F7F4EF] text-[10px] font-black uppercase tracking-[0.2em] text-[#0B0B0B]"
					>
						Comprar
					</BuyButton>
					<YnsLink
						href="#sobre-o-livro"
						className="inline-flex h-[42px] flex-1 items-center justify-center border border-[color:rgba(247,244,239,0.24)] text-[10px] font-black uppercase tracking-[0.2em] text-[color:rgba(247,244,239,0.8)]"
					>
						Ver mais
					</YnsLink>
				</div>
			</div>
		</div>
	);
}
