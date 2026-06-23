import type { CustomerOrderStatusContent } from "../order-status-notification";
import { emailShellHtml, escapeEmailHtml } from "./shell";

type Props = {
	name?: string;
	orderId: string;
	content: CustomerOrderStatusContent;
	currency?: string;
	fulfillment?: { status?: "received" | "producing" | "shipped"; trackingNumber?: string | null } | null;
	items: Array<{
		name: string;
		qty: number;
		unitAmount?: number | null;
		price?: string;
		image?: string | null;
	}>;
	totalCents?: number | null;
	supportEmail?: string;
	baseUrl?: string;
};

export function orderStatusEmailHtml({
	name,
	orderId,
	content,
	currency,
	fulfillment,
	items,
	totalCents,
	supportEmail,
	baseUrl,
}: Props) {
	const safeName = name ? ` ${escapeEmailHtml(name)}` : "";
	const resolvedBaseUrl = baseUrl || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

	function formatCurrency(amountCents?: number | null, currencyCode?: string) {
		try {
			const amount = (amountCents ?? 0) / 100;
			return new Intl.NumberFormat("pt-BR", {
				style: "currency",
				currency: currencyCode || "BRL",
			}).format(amount);
		} catch {
			const amount = ((amountCents ?? 0) / 100).toFixed(2);
			return `${currencyCode || "BRL"} ${amount}`;
		}
	}

	const progressSteps = ["received", "producing", "shipped"] as const;
	const currentIndex = fulfillment?.status
		? progressSteps.indexOf(fulfillment.status as (typeof progressSteps)[number])
		: -1;
	const progressPercent = currentIndex >= 0 ? ((currentIndex + 1) / progressSteps.length) * 100 : 0;

	const progressHtml =
		content.kind === "fulfillment" && fulfillment?.status
			? `
				<div class="progress">
					<div class="progress-rail">
						<div class="progress-fill" style="width:${progressPercent}%"></div>
					</div>
					<div class="progress-labels">
						<span>Recebido</span>
						<span>Em preparação</span>
						<span>Enviado</span>
					</div>
				</div>
			`
			: "";

	const metaHtml = `
		<div class="meta-grid">
			<div class="meta-box">
				<span class="meta-label">Pedido</span>
				<span class="meta-value">${escapeEmailHtml(orderId)}</span>
			</div>
			<div class="meta-box">
				<span class="meta-label">Status</span>
				<span class="meta-value">${escapeEmailHtml(content.statusLabel)}</span>
			</div>
		</div>
	`;

	const itemsHtml = items
		.map((item) => {
			const linePrice =
				item.unitAmount != null ? formatCurrency(item.unitAmount, currency) : item.price || "";
			const imageUrl = item.image
				? item.image.startsWith("http")
					? item.image
					: `${resolvedBaseUrl}${item.image.startsWith("/") ? item.image : `/${item.image}`}`
				: null;
			const imageHtml = imageUrl
				? `<img class="item-image" src="${escapeEmailHtml(imageUrl)}" alt="${escapeEmailHtml(item.name)}" />`
				: `<div class="item-image"></div>`;

			return `
				<tr class="item-row">
					<td>
						<table role="presentation" style="width:100%;border-collapse:collapse">
							<tr>
								<td style="width:72px;vertical-align:top">${imageHtml}</td>
								<td style="vertical-align:top">
									<div class="item-title">${escapeEmailHtml(item.name)}</div>
									<div class="item-meta">Qtd. ${item.qty}</div>
								</td>
							</tr>
						</table>
					</td>
					<td>${escapeEmailHtml(linePrice)}</td>
				</tr>
			`;
		})
		.join("");

	const totalHtml = `
		<div class="total-box">
			<span class="total-label">Total do pedido</span>
			<span class="total-value">${escapeEmailHtml(formatCurrency(totalCents ?? null, currency))}</span>
		</div>
	`;

	const trackingHtml = fulfillment?.trackingNumber
		? `
			<div class="info-card">
				<strong>Rastreio</strong>
				<p style="margin:8px 0 0">Código: ${escapeEmailHtml(fulfillment.trackingNumber)}</p>
			</div>
		`
		: "";

	const detailsHtml = content.details
		? `<div class="info-card"><strong>Próximo passo</strong><p style="margin:8px 0 0">${escapeEmailHtml(content.details)}</p></div>`
		: "";

	const bodyHtml = `
		<p class="lead">Olá${safeName},</p>
		<p>${escapeEmailHtml(content.intro)}</p>
		<span class="status-pill">${escapeEmailHtml(content.statusLabel)}</span>
		${metaHtml}
		${progressHtml}
		${trackingHtml}
		${detailsHtml}
		<table class="items-table" role="presentation">${itemsHtml}</table>
		${totalHtml}
	`;

	return emailShellHtml({
		title: content.heading,
		eyebrow: content.kind === "payment" ? "Atualização de pagamento" : "Atualização do pedido",
		preheader: `${content.heading} - pedido #${orderId}`,
		bodyHtml,
		supportEmail,
		baseUrl,
		footerNote: "Você está recebendo esta mensagem porque o status do seu pedido foi realmente atualizado.",
	});
}
