import type { ReactNode } from "react";
import {
	changePromotionStatusAction,
	createPromotionAction,
	processFavoriteDiscountAlertsAction,
	updatePromotionAction,
} from "@/app/admin/promotions/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/env.mjs";
import { DEFAULT_LOCALE } from "@/i18n/config";
import {
	formatPromotionTargets,
	listPromotionsForAdmin,
	type PromotionBenefitType,
	type PromotionKind,
	type PromotionScope,
	type PromotionStackingMode,
	type PromotionStatus,
} from "@/lib/promotions";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
import { getDecimalFromStripeAmount } from "@/lib/utils";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";

export const dynamic = "force-dynamic";

type AdminPromotion = Awaited<ReturnType<typeof listPromotionsForAdmin>>[number];
const adminCurrency = String(env.STRIPE_CURRENCY ?? "BRL")
	.trim()
	.toUpperCase();

interface PromotionFormDefaults {
	name: string;
	label: string;
	description: string;
	kind: PromotionKind;
	scope: PromotionScope;
	benefitType: PromotionBenefitType;
	benefitValue: string;
	status: PromotionStatus;
	minSubtotal: string;
	priority: string;
	code: string;
	stackingMode: PromotionStackingMode;
	startsAt: string;
	endsAt: string;
	couponStartsAt: string;
	couponEndsAt: string;
	couponGlobalLimit: string;
	couponPerCustomerLimit: string;
	productSlugs: string;
	categorySlugs: string;
	variantIds: string;
	firstPurchaseOnly: boolean;
	requireVerifiedEmail: boolean;
	notifyFavorites: boolean;
}

function getPromotionStatusLabel(status: PromotionStatus) {
	switch (status) {
		case "active":
			return "Ativa";
		case "scheduled":
			return "Agendada";
		case "draft":
			return "Rascunho";
		case "paused":
			return "Pausada";
		default:
			return status;
	}
}

function PromotionFormSection(args: {
	title: string;
	description: string;
	defaultOpen?: boolean;
	children: ReactNode;
}) {
	const { title, description, defaultOpen = false, children } = args;

	return (
		<details
			open={defaultOpen}
			className="rounded-2xl border border-border/70 bg-muted/15 shadow-sm transition-colors open:bg-background"
		>
			<summary className="cursor-pointer list-none px-4 py-4">
				<div className="flex flex-col gap-1 pr-6">
					<span className="text-sm font-semibold text-foreground">{title}</span>
					<span className="text-xs text-muted-foreground">{description}</span>
				</div>
			</summary>
			<div className="border-t border-border/60 px-4 py-4">{children}</div>
		</details>
	);
}

function formatBenefit(value: number, benefitType: string, currency?: string | null) {
	if (benefitType === "percentage_off") return `${value}%`;
	return `${getDecimalFromStripeAmount({ amount: value, currency: currency || adminCurrency })}`;
}

function formatDateTime(date: Date | string | null | undefined, locale: string) {
	if (!date) return "Sem data informada";
	const parsed = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(parsed.getTime())) return "Sem data informada";
	return new Intl.DateTimeFormat(locale, {
		dateStyle: "short",
		timeStyle: "short",
	}).format(parsed);
}

function formatDateTimeLocalValue(date?: Date | string | null) {
	if (!date) return "";
	const parsed = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(parsed.getTime())) return "";
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function formatUsageRules(promotion: AdminPromotion) {
	const code = promotion.codes[0];
	if (!code && !promotion.eligibility) return "Sem regra adicional";

	const rules: string[] = [];
	if (typeof code?.globalLimit === "number") {
		rules.push(`Limite total: ${code.globalLimit}`);
	}
	if (typeof code?.perCustomerLimit === "number") {
		rules.push(`Por cliente: ${code.perCustomerLimit}`);
	}
	if (promotion.eligibility?.firstPurchaseOnly) {
		rules.push("Apenas primeira compra");
	}
	if (promotion.eligibility?.requireVerifiedEmail) {
		rules.push("Exige e-mail verificado");
	}
	if (typeof promotion.eligibility?.minSubtotal === "number" && promotion.eligibility.minSubtotal > 0) {
		rules.push(
			`Subtotal mínimo: ${getDecimalFromStripeAmount({
				amount: promotion.eligibility.minSubtotal,
				currency: promotion.currency || adminCurrency,
			})}`,
		);
	}
	return rules.length > 0 ? rules.join(" · ") : "Sem regra adicional";
}

function buildPromotionFormDefaults(promotion?: AdminPromotion): PromotionFormDefaults {
	const code = promotion?.codes[0];
	const benefitValue =
		promotion == null
			? ""
			: promotion.benefitType === "percentage_off"
				? String(promotion.benefitValue)
				: String(
						getDecimalFromStripeAmount({
							amount: promotion.benefitValue,
							currency: promotion.currency || adminCurrency,
						}),
					);

	return {
		name: promotion?.name ?? "",
		label: promotion?.label ?? "",
		description: promotion?.description ?? "",
		kind: promotion?.kind ?? "automatic",
		scope: promotion?.scope ?? "item",
		benefitType: promotion?.benefitType ?? "percentage_off",
		benefitValue,
		status: promotion?.status ?? "active",
		minSubtotal:
			typeof promotion?.eligibility?.minSubtotal === "number"
				? String(
						getDecimalFromStripeAmount({
							amount: promotion.eligibility.minSubtotal,
							currency: promotion.currency || adminCurrency,
						}),
					)
				: "",
		priority: String(promotion?.priority ?? 0),
		code: code?.code ?? "",
		stackingMode:
			(promotion?.stackingMode as PromotionStackingMode | null) ??
			(promotion?.kind === "coupon" ? "combine_with_automatic" : "combine_with_coupon"),
		startsAt: formatDateTimeLocalValue(promotion?.schedule?.startsAt),
		endsAt: formatDateTimeLocalValue(promotion?.schedule?.endsAt),
		couponStartsAt: formatDateTimeLocalValue(code?.startsAt),
		couponEndsAt: formatDateTimeLocalValue(code?.endsAt),
		couponGlobalLimit: typeof code?.globalLimit === "number" ? String(code.globalLimit) : "",
		couponPerCustomerLimit: typeof code?.perCustomerLimit === "number" ? String(code.perCustomerLimit) : "",
		productSlugs: promotion?.targets?.productSlugs?.join("\n") ?? "",
		categorySlugs: promotion?.targets?.categorySlugs?.join("\n") ?? "",
		variantIds: promotion?.targets?.variantIds?.join("\n") ?? "",
		firstPurchaseOnly: promotion?.eligibility?.firstPurchaseOnly ?? false,
		requireVerifiedEmail: promotion?.eligibility?.requireVerifiedEmail ?? false,
		notifyFavorites: promotion?.notifyFavorites ?? true,
	};
}

function PromotionForm(args: {
	action: (formData: FormData) => void | Promise<void>;
	defaults: PromotionFormDefaults;
	submitLabel: string;
	promotionId?: string;
	lockKind?: boolean;
}) {
	const { action, defaults, submitLabel, promotionId, lockKind = false } = args;

	return (
		<form action={action} className="space-y-4">
			{promotionId ? <input type="hidden" name="promotionId" value={promotionId} /> : null}
			{lockKind ? <input type="hidden" name="kind" value={defaults.kind} /> : null}

			<div className="grid gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-3 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
				<span>1. Básicos</span>
				<span>2. Desconto e publicação</span>
				<span>3. Regras e validade</span>
				<span>4. Alvos e alertas</span>
			</div>

			<PromotionFormSection
				title="Básicos"
				description="Identidade da campanha e informações visíveis para operação e cliente."
				defaultOpen
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<label className="grid gap-2">
						<span className="text-sm font-medium">Nome</span>
						<input
							name="name"
							required
							defaultValue={defaults.name}
							className="max-w-xl rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Rótulo público</span>
						<input
							name="label"
							defaultValue={defaults.label}
							className="max-w-md rounded-lg border px-3 py-2"
							placeholder="Lançamento relâmpago"
						/>
					</label>
					<label className="grid gap-2 lg:col-span-2">
						<span className="text-sm font-medium">Descrição</span>
						<textarea
							name="description"
							rows={3}
							defaultValue={defaults.description}
							className="max-w-3xl rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Tipo</span>
						{lockKind ? (
							<input
								value={defaults.kind === "coupon" ? "Cupom" : "Automática"}
								readOnly
								disabled
								className="rounded-lg border bg-muted px-3 py-2 text-muted-foreground"
							/>
						) : (
							<select
								name="kind"
								defaultValue={defaults.kind}
								className="max-w-[12rem] rounded-lg border px-3 py-2"
							>
								<option value="automatic">Automática</option>
								<option value="coupon">Cupom</option>
							</select>
						)}
					</label>
					{promotionId ? (
						<label className="grid gap-2">
							<span className="text-sm font-medium">Status atual</span>
							<input
								value={getPromotionStatusLabel(defaults.status)}
								readOnly
								disabled
								className="max-w-[12rem] rounded-lg border bg-muted px-3 py-2 text-muted-foreground"
							/>
						</label>
					) : (
						<label className="grid gap-2">
							<span className="text-sm font-medium">Status inicial</span>
							<select
								name="status"
								defaultValue={defaults.status}
								className="max-w-[12rem] rounded-lg border px-3 py-2"
							>
								<option value="active">Ativa</option>
								<option value="scheduled">Agendada</option>
								<option value="draft">Rascunho</option>
								<option value="paused">Pausada</option>
							</select>
						</label>
					)}
				</div>
			</PromotionFormSection>

			<PromotionFormSection
				title="Desconto e publicação"
				description="Formato do desconto, alcance do benefício e prioridade de aplicação."
				defaultOpen
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<label className="grid gap-2">
						<span className="text-sm font-medium">Escopo</span>
						<select
							name="scope"
							defaultValue={defaults.scope}
							className="max-w-[12rem] rounded-lg border px-3 py-2"
						>
							<option value="item">Item</option>
							<option value="order">Pedido</option>
						</select>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Prioridade</span>
						<input
							name="priority"
							defaultValue={defaults.priority}
							className="max-w-[7rem] rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Tipo de desconto</span>
						<select
							name="benefitType"
							defaultValue={defaults.benefitType}
							className="max-w-[14rem] rounded-lg border px-3 py-2"
						>
							<option value="percentage_off">Percentual</option>
							<option value="fixed_amount_off">Valor fixo</option>
							<option value="fixed_price">Preço final</option>
						</select>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Valor</span>
						<input
							name="benefitValue"
							required
							defaultValue={defaults.benefitValue}
							className="max-w-[9rem] rounded-lg border px-3 py-2"
							placeholder="10 ou 19,90"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Subtotal mínimo</span>
						<input
							name="minSubtotal"
							defaultValue={defaults.minSubtotal}
							className="max-w-[9rem] rounded-lg border px-3 py-2"
							placeholder="19,90"
						/>
					</label>
				</div>
			</PromotionFormSection>

			<PromotionFormSection
				title="Regras e validade"
				description="Janela ativa, código do cupom, acumulação e limites por campanha ou cliente."
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<label className="grid gap-2">
						<span className="text-sm font-medium">Código do cupom</span>
						<input
							name="code"
							defaultValue={defaults.code}
							className="max-w-[11rem] rounded-lg border px-3 py-2 uppercase"
							placeholder="RATO10"
							autoCapitalize="characters"
							autoCorrect="off"
							spellCheck={false}
						/>
						<span className="text-xs text-muted-foreground">
							Espaços extras e diferenças de caixa são normalizados ao salvar.
						</span>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Acumulação do cupom</span>
						<select
							name="stackingMode"
							defaultValue={defaults.stackingMode}
							className="max-w-[15rem] rounded-lg border px-3 py-2"
						>
							<option value="combine_with_automatic">Acumula com promoções</option>
							<option value="exclusive">Não acumula</option>
						</select>
						<span className="text-xs text-muted-foreground">
							Define se o cupom pode ser combinado com promoções automáticas do catálogo.
						</span>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Início</span>
						<input
							name="startsAt"
							type="datetime-local"
							defaultValue={defaults.startsAt}
							className="max-w-[15rem] rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Fim</span>
						<input
							name="endsAt"
							type="datetime-local"
							defaultValue={defaults.endsAt}
							className="max-w-[15rem] rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Início do cupom</span>
						<input
							name="couponStartsAt"
							type="datetime-local"
							defaultValue={defaults.couponStartsAt}
							className="max-w-[15rem] rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Fim do cupom</span>
						<input
							name="couponEndsAt"
							type="datetime-local"
							defaultValue={defaults.couponEndsAt}
							className="max-w-[15rem] rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Limite total de uso</span>
						<input
							name="couponGlobalLimit"
							type="number"
							min="1"
							defaultValue={defaults.couponGlobalLimit}
							className="max-w-[8rem] rounded-lg border px-3 py-2"
							placeholder="Ex.: 100"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Máximo por cliente</span>
						<input
							name="couponPerCustomerLimit"
							type="number"
							min="1"
							defaultValue={defaults.couponPerCustomerLimit}
							className="max-w-[8rem] rounded-lg border px-3 py-2"
							placeholder="Ex.: 1"
						/>
					</label>
					<label className="flex items-start gap-3 rounded-lg border p-4 text-sm">
						<input
							type="checkbox"
							name="firstPurchaseOnly"
							defaultChecked={defaults.firstPurchaseOnly}
							className="mt-1 h-4 w-4 rounded border-gray-300"
						/>
						<span>
							<span className="block font-medium">Restringir à primeira compra</span>
							<span className="mt-1 block text-xs text-muted-foreground">
								O cupom ou a promoção só será aceito para clientes sem compras anteriores.
							</span>
						</span>
					</label>
					<label className="flex items-start gap-3 rounded-lg border p-4 text-sm">
						<input
							type="checkbox"
							name="requireVerifiedEmail"
							defaultChecked={defaults.requireVerifiedEmail}
							className="mt-1 h-4 w-4 rounded border-gray-300"
						/>
						<span>
							<span className="block font-medium">Exigir e-mail verificado</span>
							<span className="mt-1 block text-xs text-muted-foreground">
								Bloqueia o uso para contas com e-mail ainda não verificado.
							</span>
						</span>
					</label>
				</div>
			</PromotionFormSection>

			<PromotionFormSection
				title="Alvos e alertas"
				description="Produtos ou categorias impactados pela campanha e comportamento associado de comunicação."
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<label className="grid gap-2 lg:col-span-2">
						<span className="text-sm font-medium">Slugs de produtos</span>
						<textarea
							name="productSlugs"
							rows={2}
							defaultValue={defaults.productSlugs}
							className="max-w-2xl rounded-lg border px-3 py-2"
							placeholder="produto-1, produto-2"
							autoCapitalize="none"
							autoCorrect="off"
							spellCheck={false}
						/>
						<span className="text-xs text-muted-foreground">
							Você pode separar por vírgula ou quebra de linha. O sistema normaliza os slugs ao salvar.
						</span>
					</label>
					<label className="grid gap-2 lg:col-span-2">
						<span className="text-sm font-medium">Slugs de categorias</span>
						<textarea
							name="categorySlugs"
							rows={2}
							defaultValue={defaults.categorySlugs}
							className="max-w-2xl rounded-lg border px-3 py-2"
							placeholder="livros, poesia"
							autoCapitalize="none"
							autoCorrect="off"
							spellCheck={false}
						/>
						<span className="text-xs text-muted-foreground">
							Você pode separar por vírgula ou quebra de linha. O sistema normaliza os slugs ao salvar.
						</span>
					</label>
					<label className="grid gap-2 lg:col-span-2">
						<span className="text-sm font-medium">Variantes específicas</span>
						<textarea
							name="variantIds"
							rows={2}
							defaultValue={defaults.variantIds}
							className="max-w-2xl rounded-lg border px-3 py-2"
							placeholder="id-da-variante-1, id-da-variante-2"
							autoCapitalize="none"
							autoCorrect="off"
							spellCheck={false}
						/>
						<span className="text-xs text-muted-foreground">
							Use apenas quando precisar mirar variantes individuais. Você pode separar por vírgula ou quebra
							de linha, e valores vazios são descartados ao salvar.
						</span>
					</label>
					<label className="flex items-start gap-3 rounded-lg border p-4 text-sm lg:col-span-2">
						<input
							type="checkbox"
							name="notifyFavorites"
							defaultChecked={defaults.notifyFavorites}
							className="mt-1 h-4 w-4 rounded border-gray-300"
						/>
						<span>
							<span className="block font-medium">Gerar alertas para favoritos afetados</span>
							<span className="mt-1 block text-xs text-muted-foreground">
								Quando esta promoção automática estiver ativa, favoritos elegíveis entram na fila de e-mail.
							</span>
						</span>
					</label>
				</div>
			</PromotionFormSection>

			<div>
				<button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
					{submitLabel}
				</button>
			</div>
		</form>
	);
}

export default async function AdminPromotionsPage() {
	const locale = (await getDefaultLocaleSetting()) ?? DEFAULT_LOCALE;
	const promotions = await listPromotionsForAdmin();
	const createDefaults = buildPromotionFormDefaults();
	const activeCount = promotions.filter((promotion) => promotion.status === "active").length;
	const couponCount = promotions.filter((promotion) => promotion.kind === "coupon").length;
	const pendingAlerts = promotions.reduce((total, promotion) => total + promotion.pendingNotifications, 0);

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Promoções"
				title="Promoções"
				description="Gerencie campanhas, cupons e alertas."
				actions={
					<form action={processFavoriteDiscountAlertsAction}>
						<button
							type="submit"
							className="rounded-none border border-[color:var(--editorial-ink)] px-4 py-3 text-sm font-semibold text-[color:var(--editorial-ink)] transition-colors hover:bg-[color:var(--editorial-ink)] hover:text-[color:var(--editorial-paper)]"
						>
							Processar alertas pendentes
						</button>
					</form>
				}
			/>
			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Promoções"
					value={promotions.length}
					helper="Campanhas automáticas e cupons cadastrados."
				/>
				<AdminEditorialStat
					label="Ativas"
					value={activeCount}
					helper="Regras publicadas e elegíveis para aplicação."
				/>
				<AdminEditorialStat
					label="Alertas pendentes"
					value={pendingAlerts}
					helper={`${couponCount} campanha(s) do tipo cupom neste acervo.`}
				/>
			</div>

			<EditorialPanel className="p-0">
				<Card className="border-none bg-transparent shadow-none">
					<CardHeader>
						<CardTitle>Nova promoção</CardTitle>
						<CardDescription>
							Crie uma campanha automática ou um cupom. Valores monetários devem ser informados em formato
							decimal, como <code className="ml-1">19,90</code>. Para cupons, você também pode definir
							validade e limites de uso.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<PromotionForm
							action={createPromotionAction}
							defaults={createDefaults}
							submitLabel="Criar promoção"
						/>
					</CardContent>
				</Card>
			</EditorialPanel>

			<div className="grid gap-4">
				{promotions.length === 0 ? (
					<Card>
						<CardContent className="p-6 text-sm text-muted-foreground">
							Nenhuma promoção cadastrada ainda.
						</CardContent>
					</Card>
				) : (
					promotions.map((promotion) => {
						const defaults = buildPromotionFormDefaults(promotion);
						return (
							<Card key={promotion._id?.toString()}>
								<CardHeader className="gap-3">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div className="space-y-1">
											<CardTitle className="text-xl">{promotion.name}</CardTitle>
											<CardDescription>{promotion.description || "Sem resumo informado."}</CardDescription>
										</div>
										<div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
											<span className="rounded-full border px-3 py-1">
												{promotion.status === "active"
													? "ativa"
													: promotion.status === "scheduled"
														? "agendada"
														: promotion.status === "draft"
															? "rascunho"
															: promotion.status === "paused"
																? "pausada"
																: promotion.status === "archived"
																	? "arquivada"
																	: promotion.status}
											</span>
											<span className="rounded-full border px-3 py-1">
												{promotion.kind === "coupon" ? "cupom" : "automática"}
											</span>
											<span className="rounded-full border px-3 py-1">
												{promotion.scope === "order" ? "pedido" : "item"}
											</span>
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
										<div className="rounded-lg border p-3 text-sm">
											<div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
												Desconto
											</div>
											<div className="mt-1 font-medium">
												{formatBenefit(promotion.benefitValue, promotion.benefitType, promotion.currency)}
											</div>
										</div>
										<div className="rounded-lg border p-3 text-sm">
											<div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Alvos</div>
											<div className="mt-1 font-medium">{formatPromotionTargets(promotion.targets)}</div>
										</div>
										<div className="rounded-lg border p-3 text-sm">
											<div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Códigos</div>
											<div className="mt-1 font-medium">
												{promotion.codes.length > 0
													? promotion.codes.map((code) => code.code).join(", ")
													: "Sem cupom"}
											</div>
										</div>
										<div className="rounded-lg border p-3 text-sm">
											<div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Regras</div>
											<div className="mt-1 font-medium">{formatUsageRules(promotion)}</div>
										</div>
										<div className="rounded-lg border p-3 text-sm">
											<div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
												Alertas pendentes
											</div>
											<div className="mt-1 font-medium">{promotion.pendingNotifications}</div>
										</div>
									</div>
									<div className="grid gap-3 md:grid-cols-2">
										<div className="rounded-lg border p-3 text-sm">
											<div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
												Janela da promoção
											</div>
											<div className="mt-1 font-medium">
												{formatDateTime(promotion.schedule?.startsAt, locale)} até{" "}
												{formatDateTime(promotion.schedule?.endsAt, locale)}
											</div>
										</div>
										<div className="rounded-lg border p-3 text-sm">
											<div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
												Janela do cupom
											</div>
											<div className="mt-1 font-medium">
												{promotion.codes[0]
													? `${formatDateTime(promotion.codes[0].startsAt, locale)} até ${formatDateTime(promotion.codes[0].endsAt, locale)}`
													: "Não se aplica"}
											</div>
										</div>
									</div>
									<div className="flex flex-wrap gap-2">
										<form action={changePromotionStatusAction}>
											<input type="hidden" name="promotionId" value={promotion._id?.toString()} />
											<input type="hidden" name="status" value="active" />
											<button type="submit" className="rounded-lg border px-3 py-2 text-sm font-medium">
												Ativar
											</button>
										</form>
										<form action={changePromotionStatusAction}>
											<input type="hidden" name="promotionId" value={promotion._id?.toString()} />
											<input type="hidden" name="status" value="paused" />
											<button type="submit" className="rounded-lg border px-3 py-2 text-sm font-medium">
												Desativar
											</button>
										</form>
										<form action={changePromotionStatusAction}>
											<input type="hidden" name="promotionId" value={promotion._id?.toString()} />
											<input type="hidden" name="status" value="archived" />
											<button type="submit" className="rounded-lg border px-3 py-2 text-sm font-medium">
												Arquivar
											</button>
										</form>
									</div>
									<details className="rounded-xl border bg-muted/20">
										<summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
											Editar promoção
										</summary>
										<div className="border-t p-4">
											<PromotionForm
												action={updatePromotionAction}
												defaults={defaults}
												submitLabel="Salvar promoção"
												promotionId={promotion._id?.toString()}
												lockKind
											/>
										</div>
									</details>
								</CardContent>
							</Card>
						);
					})
				)}
			</div>
		</AdminEditorialPage>
	);
}
