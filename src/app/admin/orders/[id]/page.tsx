import { redirect } from "next/navigation";
import { env } from "@/env.mjs";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { getDb } from "@/lib/mongodb";
import { listOrderAuditEntries, type OrderAuditEntry } from "@/lib/order-audit";
import { matchesOrderIdentifier, type OrderRelatedIds } from "@/lib/order-identity";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { Reveal } from "@/ui/motion/reveal";
import { Badge } from "@/ui/shadcn/badge";
import { StatusBadge } from "@/ui/status-badge";
import UpdateFulfillment from "../_components/update-fulfillment.client";

function formatAuditValue(value: string | null | undefined) {
	if (!value) return "Não informado";
	return value;
}

function getAuditSummary(entry: OrderAuditEntry) {
	switch (entry.action) {
		case "order_fulfillment_updated":
			return "Expedição atualizada";
		case "order_payment_status_webhook_updated":
			return "Status de pagamento atualizado por evento recebido";
	}
}

function getAuditChanges(entry: OrderAuditEntry) {
	const details = (entry.details ?? {}) as {
		previousStatus?: string | null;
		nextStatus?: string | null;
		previousTrackingNumber?: string | null;
		nextTrackingNumber?: string | null;
		webhookType?: string | null;
		webhookEventId?: string | null;
	};
	const changes: Array<{ label: string; previous: string; next: string }> = [];

	if (entry.action === "order_fulfillment_updated" && details.previousStatus !== details.nextStatus) {
		changes.push({
			label: "Status de expedição",
			previous: formatAuditValue(details.previousStatus),
			next: formatAuditValue(details.nextStatus),
		});
	}

	if (
		entry.action === "order_payment_status_webhook_updated" &&
		details.previousStatus !== details.nextStatus
	) {
		changes.push({
			label: "Status de pagamento",
			previous: formatAuditValue(details.previousStatus),
			next: formatAuditValue(details.nextStatus),
		});
	}

	if (
		entry.action === "order_fulfillment_updated" &&
		details.previousTrackingNumber !== details.nextTrackingNumber
	) {
		changes.push({
			label: "Código de rastreio",
			previous: formatAuditValue(details.previousTrackingNumber),
			next: formatAuditValue(details.nextTrackingNumber),
		});
	}

	return changes;
}

function formatMoney(amount: number, currency: string, locale: string, fallbackCurrency: string) {
	try {
		return new Intl.NumberFormat(locale, {
			style: "currency",
			currency: currency?.toUpperCase?.() || fallbackCurrency,
		}).format((amount || 0) / 100);
	} catch {
		return `${((amount || 0) / 100).toFixed(2)} ${currency?.toUpperCase?.() || fallbackCurrency}`;
	}
}

function formatDateTime(value: string | Date, locale: string) {
	return new Intl.DateTimeFormat(locale, {
		dateStyle: "short",
		timeStyle: "short",
	}).format(new Date(value));
}

function getFulfillmentLabel(status?: "received" | "producing" | "shipped") {
	switch (status) {
		case "received":
			return "Recebido";
		case "producing":
			return "Em produção";
		case "shipped":
			return "Enviado";
		default:
			return "Não iniciado";
	}
}

function getDeliveryMethodLabel(method?: "saved-address" | "new-address" | "pickup" | null) {
	switch (method) {
		case "saved-address":
			return "Endereço salvo";
		case "new-address":
			return "Novo endereço";
		case "pickup":
			return "Retirada";
		default:
			return "Não informado";
	}
}

function formatShippingAddress(
	address?: {
		line1?: string | null;
		line2?: string | null;
		number?: string | null;
		complement?: string | null;
		district?: string | null;
		city?: string | null;
		state?: string | null;
		postalCode?: string | null;
		country?: string | null;
	} | null,
) {
	if (!address) return [];

	const street = [address.line1, address.number].filter(Boolean).join(", ");
	const extra = [address.line2, address.complement, address.district].filter(Boolean).join(" • ");
	const locality = [address.city, address.state].filter(Boolean).join(" / ");
	const region = [address.postalCode, address.country].filter(Boolean).join(" • ");

	return [street, extra, locality, region].filter(Boolean);
}

function getActorRoleLabel(role?: string | null) {
	switch (role) {
		case "admin":
			return "Administrador";
		case "vendor":
			return "Vendedor";
		case "customer":
			return "Cliente";
		case "system":
			return "Automação";
		default:
			return "Equipe";
	}
}

export default async function AdminOrderDetails({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "orders.read")) redirect("/forbidden");
	const locale = (await getDefaultLocaleSetting()) ?? DEFAULT_LOCALE;
	const fallbackCurrency = String(env.CATALOG_CURRENCY ?? "BRL")
		.trim()
		.toUpperCase();

	const purchaseId = id;
	if (!purchaseId) redirect("/admin/orders");

	const db = await getDb();
	const pipeline = [
		{ $match: { purchases: { $exists: true, $ne: [] } } },
		{ $project: { email: 1, purchases: 1 } },
		{ $unwind: "$purchases" },
		{
			$match: {
				$or: [
					{ "purchases.id": purchaseId },
					{ "purchases.relatedIds.mercadoPagoPaymentId": purchaseId },
					{ "purchases.relatedIds.mercadoPagoOrderId": purchaseId },
				],
			},
		},
		{ $limit: 1 },
	];
	const docs = await db.collection("users").aggregate(pipeline).toArray();
	const doc = docs[0];
	if (!doc) redirect("/admin/orders");

	const p = doc.purchases as {
		id: string;
		amountTotal: number;
		currency: string;
		status: string;
		createdAt: string | Date;
		items?: Array<{ name?: string | null; quantity: number; unitAmount?: number | null }>;
		fulfillment?: { status?: "received" | "producing" | "shipped"; trackingNumber?: string | null };
		relatedIds?: OrderRelatedIds;
		deliveryMethod?: "saved-address" | "new-address" | "pickup" | null;
		deliveryAddress?: {
			line1?: string | null;
			line2?: string | null;
			number?: string | null;
			complement?: string | null;
			district?: string | null;
			city?: string | null;
			state?: string | null;
			postalCode?: string | null;
			country?: string | null;
		} | null;
		shippingRate?: {
			providerCode?: string | null;
			serviceCode?: string | null;
			serviceName?: string | null;
			amount?: number | null;
			currency?: string | null;
			estimatedDays?: number | null;
			quotedAt?: string | null;
		} | null;
	};
	if (!matchesOrderIdentifier(p, purchaseId)) redirect("/admin/orders");
	const history = await listOrderAuditEntries(p.id, 15);
	const itemCount = p.items?.reduce((total, item) => total + (item.quantity || 0), 0) ?? 0;
	const auditCount = history.length;
	const fulfillmentLabel = getFulfillmentLabel(p.fulfillment?.status);
	const shippingAddressLines = formatShippingAddress(p.deliveryAddress);

	return (
		<AdminEditorialPage>
			<Reveal>
				<AdminEditorialHero
					eyebrow="Pedido"
					title={`Pedido ${p.id}`}
					description="Revise pagamento, itens, expedição e histórico em uma leitura direta."
				/>
			</Reveal>
			<Reveal delay={0.04}>
				<div className="grid gap-5 lg:grid-cols-4">
					<AdminEditorialStat
						label="Status"
						value={<StatusBadge status={p.status} />}
						helper="Situação atual do pagamento."
					/>
					<AdminEditorialStat
						label="Total"
						value={formatMoney(p.amountTotal || 0, p.currency, locale, fallbackCurrency)}
						helper="Valor consolidado deste pedido."
					/>
					<AdminEditorialStat
						label="Itens"
						value={itemCount}
						helper="Quantidade total de unidades na compra."
					/>
					<AdminEditorialStat
						label="Expedição"
						value={fulfillmentLabel}
						helper="Etapa atual entre produção e envio."
					/>
				</div>
			</Reveal>
			<Reveal delay={0.08}>
				<EditorialPanel className="space-y-6">
					<div className="space-y-1">
						<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
							Resumo
						</div>
						<h2 className="editorial-serif text-2xl font-semibold text-[color:var(--editorial-ink)]">
							Resumo do pedido
						</h2>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						<div className="space-y-1 xl:col-span-2">
							<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
								Pedido
							</div>
							<div className="font-mono text-sm break-all text-[color:var(--editorial-ink)]">{p.id}</div>
						</div>
						<div className="space-y-1">
							<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
								E-mail do cliente
							</div>
							<div className="break-all text-sm text-[color:var(--editorial-ink)]">{doc.email}</div>
						</div>
						<div className="space-y-1">
							<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
								Criado em
							</div>
							<div className="text-sm text-[color:var(--editorial-ink)]">
								{formatDateTime(p.createdAt, locale)}
							</div>
						</div>
						<div className="space-y-1">
							<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
								{p.relatedIds?.mercadoPagoOrderId
									? "ID da order (Mercado Pago)"
									: "ID do pagamento (Mercado Pago)"}
							</div>
							<div className="font-mono text-xs break-all text-[color:var(--editorial-muted)]">
								{p.relatedIds?.mercadoPagoOrderId || p.relatedIds?.mercadoPagoPaymentId || "Não informado"}
							</div>
						</div>
					</div>
					<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-4 sm:p-5">
						<div className="mb-4 space-y-1">
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
								Expedição
							</div>
							<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
								Atualize status e rastreio. A mudança aparece no histórico logo abaixo.
							</p>
						</div>
						<div className="mb-4 space-y-3 border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)] p-3">
							<div className="space-y-1">
								<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
									Entrega selecionada
								</div>
								<div className="text-sm text-[color:var(--editorial-ink)]">
									{getDeliveryMethodLabel(p.deliveryMethod)}
								</div>
							</div>
							{p.shippingRate ? (
								<div className="space-y-1">
									<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
										Frete cotado
									</div>
									<div className="text-sm text-[color:var(--editorial-ink)]">
										{p.shippingRate.serviceName || "Serviço não informado"}
									</div>
									<div className="text-xs text-[color:var(--editorial-muted)]">
										{[
											p.shippingRate.providerCode ? `Provedor: ${p.shippingRate.providerCode}` : null,
											p.shippingRate.serviceCode ? `Serviço: ${p.shippingRate.serviceCode}` : null,
										]
											.filter(Boolean)
											.join(" • ")}
									</div>
									<div className="text-sm text-[color:var(--editorial-muted)]">
										{typeof p.shippingRate.amount === "number"
											? formatMoney(
													p.shippingRate.amount,
													p.shippingRate.currency || p.currency,
													locale,
													fallbackCurrency,
												)
											: "Valor não informado"}
										{typeof p.shippingRate.estimatedDays === "number"
											? ` • ${p.shippingRate.estimatedDays} dia${p.shippingRate.estimatedDays === 1 ? "" : "s"} estimados`
											: ""}
									</div>
									{p.shippingRate.quotedAt ? (
										<div className="text-xs text-[color:var(--editorial-muted)]">
											Cotado em {formatDateTime(p.shippingRate.quotedAt, locale)}
										</div>
									) : null}
								</div>
							) : null}
							{shippingAddressLines.length > 0 ? (
								<div className="space-y-1">
									<div className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
										Endereço de entrega
									</div>
									<div className="space-y-1 text-sm text-[color:var(--editorial-ink)]">
										{shippingAddressLines.map((line) => (
											<div key={line}>{line}</div>
										))}
									</div>
								</div>
							) : null}
						</div>
						<UpdateFulfillment
							id={p.id}
							current={p.fulfillment}
							statuses={["received", "producing", "shipped"]}
						/>
					</div>
				</EditorialPanel>
			</Reveal>
			<div className="grid gap-6 xl:grid-cols-2">
				<Reveal delay={0.12}>
					<EditorialPanel className="space-y-5">
						<div className="space-y-1">
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
								Itens
							</div>
							<h2 className="editorial-serif text-2xl font-semibold text-[color:var(--editorial-ink)]">
								Composição da compra
							</h2>
						</div>
						<ul className="divide-y divide-[color:var(--editorial-border)]">
							{(p.items || []).map((it, idx) => (
								<li key={idx} className="flex items-center justify-between gap-3 py-4">
									<div className="min-w-0">
										<div className="font-medium break-words text-[color:var(--editorial-ink)]">
											{it.name || "Item sem nome informado"}
										</div>
										<div className="text-sm text-[color:var(--editorial-muted)]">Qtd.: {it.quantity}</div>
									</div>
									<div className="text-sm text-[color:var(--editorial-ink)]">
										{typeof it.unitAmount === "number"
											? formatMoney(it.unitAmount, p.currency, locale, fallbackCurrency)
											: "Valor não informado"}
									</div>
								</li>
							))}
							{(p.items || []).length === 0 ? (
								<li className="py-6 text-[color:var(--editorial-muted)]">Nenhum item registrado.</li>
							) : null}
						</ul>
					</EditorialPanel>
				</Reveal>
				<Reveal delay={0.16}>
					<EditorialPanel className="space-y-5">
						<div className="space-y-2">
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
								Auditoria
							</div>
							<h2 className="editorial-serif text-2xl font-semibold text-[color:var(--editorial-ink)]">
								Histórico de edição
							</h2>
							<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
								Toda atualização manual ou automática de status aparece aqui com autoria e origem.
							</p>
						</div>
						<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-4">
							<div className="text-sm text-[color:var(--editorial-muted)]">
								{auditCount === 0
									? "Ainda não há registros neste pedido."
									: `${auditCount} ${auditCount === 1 ? "registro recente" : "registros recentes"}.`}
							</div>
						</div>
						<ul className="space-y-3">
							{history.map((entry) => (
								<li
									key={String(entry._id)}
									className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-4"
								>
									<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
										<div className="space-y-2">
											<div className="flex flex-wrap items-center gap-2">
												<div className="font-medium text-[color:var(--editorial-ink)]">
													{getAuditSummary(entry)}
												</div>
												<Badge variant="outline">{getActorRoleLabel(entry.actorRole)}</Badge>
											</div>
											<div className="text-sm text-[color:var(--editorial-muted)]">
												{entry.actorRole === "system"
													? "Automação de recebimento"
													: entry.actorEmail || entry.actorId}
											</div>
											{entry.action === "order_payment_status_webhook_updated" ? (
												<div className="text-xs text-[color:var(--editorial-muted)]">
													{((entry.details ?? {}) as { webhookType?: string | null }).webhookType ||
														"Evento recebido"}
												</div>
											) : null}
										</div>
										<div className="text-xs text-[color:var(--editorial-muted)]">
											{formatDateTime(entry.createdAt, locale)}
										</div>
									</div>
									<div className="mt-4 grid gap-3">
										{getAuditChanges(entry).map((change) => (
											<div
												key={change.label}
												className="border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)] p-3"
											>
												<div className="text-xs font-medium uppercase tracking-wide text-[color:var(--editorial-muted)]">
													{change.label}
												</div>
												<div className="mt-2 grid gap-2 sm:grid-cols-2">
													<div className="border border-[color:var(--editorial-border)] bg-white px-3 py-2">
														<div className="text-xs text-[color:var(--editorial-muted)]">Antes</div>
														<div className="text-sm text-[color:var(--editorial-ink)]">{change.previous}</div>
													</div>
													<div className="border border-[color:var(--editorial-border)] bg-white px-3 py-2">
														<div className="text-xs text-[color:var(--editorial-muted)]">Depois</div>
														<div className="text-sm text-[color:var(--editorial-ink)]">{change.next}</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</li>
							))}
							{history.length === 0 ? (
								<li className="border border-dashed border-[color:var(--editorial-border)] py-8 text-center text-[color:var(--editorial-muted)]">
									Nenhuma mudança de status registrada ainda.
								</li>
							) : null}
						</ul>
					</EditorialPanel>
				</Reveal>
			</div>
		</AdminEditorialPage>
	);
}
