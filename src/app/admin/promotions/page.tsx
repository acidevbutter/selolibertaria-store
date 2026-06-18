import type { ReactNode } from "react";
import {
	changePromotionStatusAction,
	createPromotionAction,
	processFavoriteDiscountAlertsAction,
	updatePromotionAction,
} from "@/app/admin/promotions/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	formatPromotionTargets,
	listPromotionsForAdmin,
	type PromotionBenefitType,
	type PromotionKind,
	type PromotionScope,
	type PromotionStackingMode,
	type PromotionStatus,
} from "@/lib/promotions";
import { getDecimalFromStripeAmount } from "@/lib/utils";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";

export const dynamic = "force-dynamic";

type AdminPromotion = Awaited<ReturnType<typeof listPromotionsForAdmin>>[number];

interface PromotionFormDefaults {
	name: string;
	label: string;
	description: string;
	kind: PromotionKind;
	scope: PromotionScope;
	benefitType: PromotionBenefitType;
	benefitValue: string;
	currency: string;
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
	return `${getDecimalFromStripeAmount({ amount: value, currency: currency || "BRL" })}`;
}

function formatDateTime(date?: Date | string | null) {
	if (!date) return "No date";
	const parsed = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(parsed.getTime())) return "No date";
	return new Intl.DateTimeFormat("en-US", {
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
	if (!code && !promotion.eligibility) return "No additional rules";

	const rules: string[] = [];
	if (typeof code?.globalLimit === "number") {
		rules.push(`Total limit: ${code.globalLimit}`);
	}
	if (typeof code?.perCustomerLimit === "number") {
		rules.push(`Per customer: ${code.perCustomerLimit}`);
	}
	if (promotion.eligibility?.firstPurchaseOnly) {
		rules.push("First purchase only");
	}
	if (promotion.eligibility?.requireVerifiedEmail) {
		rules.push("Verified email required");
	}
	if (typeof promotion.eligibility?.minSubtotal === "number" && promotion.eligibility.minSubtotal > 0) {
		rules.push(
			`Minimum subtotal: ${getDecimalFromStripeAmount({
				amount: promotion.eligibility.minSubtotal,
				currency: promotion.currency || "BRL",
			})}`,
		);
	}
	return rules.length > 0 ? rules.join(" | ") : "No additional rules";
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
							currency: promotion.currency || "BRL",
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
		currency: promotion?.currency ?? "BRL",
		status: promotion?.status ?? "active",
		minSubtotal:
			typeof promotion?.eligibility?.minSubtotal === "number"
				? String(
						getDecimalFromStripeAmount({
							amount: promotion.eligibility.minSubtotal,
							currency: promotion.currency || "BRL",
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
				<span>1. Basics</span>
				<span>2. Discount and publishing</span>
				<span>3. Rules and validity</span>
				<span>4. Targets and alerts</span>
			</div>

			<PromotionFormSection
				title="Basics"
				description="Campaign identity and information visible to the team and the customer."
				defaultOpen
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<label className="grid gap-2">
						<span className="text-sm font-medium">Name</span>
						<input
							name="name"
							required
							defaultValue={defaults.name}
							className="rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Public label</span>
						<input
							name="label"
							defaultValue={defaults.label}
							className="rounded-lg border px-3 py-2"
							placeholder="Flash sale"
						/>
					</label>
					<label className="grid gap-2 lg:col-span-2">
						<span className="text-sm font-medium">Description</span>
						<textarea
							name="description"
							rows={3}
							defaultValue={defaults.description}
							className="rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Type</span>
						{lockKind ? (
							<input
								value={defaults.kind === "coupon" ? "Coupon" : "Automatic"}
								readOnly
								disabled
								className="rounded-lg border bg-muted px-3 py-2 text-muted-foreground"
							/>
						) : (
							<select name="kind" defaultValue={defaults.kind} className="rounded-lg border px-3 py-2">
								<option value="automatic">Automatic</option>
								<option value="coupon">Coupon</option>
							</select>
						)}
					</label>
					{promotionId ? (
						<label className="grid gap-2">
							<span className="text-sm font-medium">Current status</span>
							<input
								value={defaults.status}
								readOnly
								disabled
								className="rounded-lg border bg-muted px-3 py-2 text-muted-foreground"
							/>
						</label>
					) : (
						<label className="grid gap-2">
							<span className="text-sm font-medium">Initial status</span>
							<select name="status" defaultValue={defaults.status} className="rounded-lg border px-3 py-2">
								<option value="active">Active</option>
								<option value="scheduled">Scheduled</option>
								<option value="draft">Draft</option>
								<option value="paused">Paused</option>
							</select>
						</label>
					)}
				</div>
			</PromotionFormSection>

			<PromotionFormSection
				title="Discount and publishing"
				description="Discount model, benefit scope, and application priority."
				defaultOpen
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<label className="grid gap-2">
						<span className="text-sm font-medium">Scope</span>
						<select name="scope" defaultValue={defaults.scope} className="rounded-lg border px-3 py-2">
							<option value="item">Item</option>
							<option value="order">Order</option>
						</select>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Priority</span>
						<input name="priority" defaultValue={defaults.priority} className="rounded-lg border px-3 py-2" />
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Discount type</span>
						<select
							name="benefitType"
							defaultValue={defaults.benefitType}
							className="rounded-lg border px-3 py-2"
						>
							<option value="percentage_off">Percentage</option>
							<option value="fixed_amount_off">Fixed amount</option>
							<option value="fixed_price">Final price</option>
						</select>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Value</span>
						<input
							name="benefitValue"
							required
							defaultValue={defaults.benefitValue}
							className="rounded-lg border px-3 py-2"
							placeholder="10 ou 19.90"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Currency</span>
						<input name="currency" defaultValue={defaults.currency} className="rounded-lg border px-3 py-2" />
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Minimum subtotal</span>
						<input
							name="minSubtotal"
							defaultValue={defaults.minSubtotal}
							className="rounded-lg border px-3 py-2"
							placeholder="0.00"
						/>
					</label>
				</div>
			</PromotionFormSection>

			<PromotionFormSection
				title="Rules and validity"
				description="Active period, coupon code, stacking rules, and usage limits by campaign or customer."
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<label className="grid gap-2">
						<span className="text-sm font-medium">Coupon code</span>
						<input
							name="code"
							defaultValue={defaults.code}
							className="rounded-lg border px-3 py-2"
							placeholder="RATO10"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Coupon stacking</span>
						<select
							name="stackingMode"
							defaultValue={defaults.stackingMode}
							className="rounded-lg border px-3 py-2"
						>
							<option value="combine_with_automatic">Stacks with promotions</option>
							<option value="exclusive">Does not stack</option>
						</select>
						<span className="text-xs text-muted-foreground">
							Defines whether the coupon can be combined with automatic catalog promotions.
						</span>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Start</span>
						<input
							name="startsAt"
							type="datetime-local"
							defaultValue={defaults.startsAt}
							className="rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">End</span>
						<input
							name="endsAt"
							type="datetime-local"
							defaultValue={defaults.endsAt}
							className="rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Coupon start</span>
						<input
							name="couponStartsAt"
							type="datetime-local"
							defaultValue={defaults.couponStartsAt}
							className="rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Coupon end</span>
						<input
							name="couponEndsAt"
							type="datetime-local"
							defaultValue={defaults.couponEndsAt}
							className="rounded-lg border px-3 py-2"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Total usage limit</span>
						<input
							name="couponGlobalLimit"
							type="number"
							min="1"
							defaultValue={defaults.couponGlobalLimit}
							className="rounded-lg border px-3 py-2"
							placeholder="Example: 100"
						/>
					</label>
					<label className="grid gap-2">
						<span className="text-sm font-medium">Max uses per customer</span>
						<input
							name="couponPerCustomerLimit"
							type="number"
							min="1"
							defaultValue={defaults.couponPerCustomerLimit}
							className="rounded-lg border px-3 py-2"
							placeholder="Example: 1"
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
							<span className="block font-medium">Restrict to first purchase</span>
							<span className="mt-1 block text-xs text-muted-foreground">
								The coupon or promotion will only be accepted for customers with no previous purchases.
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
							<span className="block font-medium">Require verified email</span>
							<span className="mt-1 block text-xs text-muted-foreground">
								Blocks usage for accounts with an unverified email.
							</span>
						</span>
					</label>
				</div>
			</PromotionFormSection>

			<PromotionFormSection
				title="Targets and alerts"
				description="Products or categories affected by the campaign and related communication behavior."
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<label className="grid gap-2 lg:col-span-2">
						<span className="text-sm font-medium">Product slugs</span>
						<textarea
							name="productSlugs"
							rows={2}
							defaultValue={defaults.productSlugs}
							className="rounded-lg border px-3 py-2"
							placeholder="produto-1, produto-2"
						/>
					</label>
					<label className="grid gap-2 lg:col-span-2">
						<span className="text-sm font-medium">Category slugs</span>
						<textarea
							name="categorySlugs"
							rows={2}
							defaultValue={defaults.categorySlugs}
							className="rounded-lg border px-3 py-2"
							placeholder="t-shirts, hoodies"
						/>
					</label>
					<label className="grid gap-2 lg:col-span-2">
						<span className="text-sm font-medium">Variant IDs</span>
						<textarea
							name="variantIds"
							rows={2}
							defaultValue={defaults.variantIds}
							className="rounded-lg border px-3 py-2"
							placeholder="price_123, price_456"
						/>
					</label>
					<label className="flex items-start gap-3 rounded-lg border p-4 text-sm lg:col-span-2">
						<input
							type="checkbox"
							name="notifyFavorites"
							defaultChecked={defaults.notifyFavorites}
							className="mt-1 h-4 w-4 rounded border-gray-300"
						/>
						<span>
							<span className="block font-medium">Generate alerts for affected favorites</span>
							<span className="mt-1 block text-xs text-muted-foreground">
								When this automatic promotion is active, eligible favorites enter the email queue.
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
							decimal, como <code className="ml-1">19.90</code>. Para cupons, você também pode definir
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
											<CardDescription>{promotion.description || "Sem descrição."}</CardDescription>
										</div>
										<div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
											<span className="rounded-full border px-3 py-1">{promotion.status}</span>
											<span className="rounded-full border px-3 py-1">{promotion.kind}</span>
											<span className="rounded-full border px-3 py-1">{promotion.scope}</span>
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
													: "Sem código"}
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
												{formatDateTime(promotion.schedule?.startsAt)} até{" "}
												{formatDateTime(promotion.schedule?.endsAt)}
											</div>
										</div>
										<div className="rounded-lg border p-3 text-sm">
											<div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
												Janela do cupom
											</div>
											<div className="mt-1 font-medium">
												{promotion.codes[0]
													? `${formatDateTime(promotion.codes[0].startsAt)} até ${formatDateTime(promotion.codes[0].endsAt)}`
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
												submitLabel="Salvar alterações"
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
