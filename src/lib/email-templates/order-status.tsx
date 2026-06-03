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
}: Props) {
	const safeName = name ? ` ${escapeEmailHtml(name)}` : "";
	const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

	function formatCurrency(amountCents?: number | null, currencyCode?: string) {
		try {
			const amount = (amountCents ?? 0) / 100;
			return new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: currencyCode || "USD",
			}).format(amount);
		} catch {
			const amount = ((amountCents ?? 0) / 100).toFixed(2);
			return `${currencyCode || "USD"} ${amount}`;
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
						<span>Received</span>
						<span>In production</span>
						<span>Shipped</span>
					</div>
				</div>
			`
			: "";

	const metaHtml = `
		<div class="meta-grid">
			<div class="meta-box">
				<span class="meta-label">Order</span>
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
					: `${baseUrl}${item.image.startsWith("/") ? item.image : `/${item.image}`}`
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
									<div class="item-meta">Qty. ${item.qty}</div>
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
			<span class="total-label">Order total</span>
			<span class="total-value">${escapeEmailHtml(formatCurrency(totalCents ?? null, currency))}</span>
		</div>
	`;

	const trackingHtml = fulfillment?.trackingNumber
		? `
			<div class="info-card">
				<strong>Tracking</strong>
				<p style="margin:8px 0 0">Code: ${escapeEmailHtml(fulfillment.trackingNumber)}</p>
			</div>
		`
		: "";

	const detailsHtml = content.details
		? `<div class="info-card"><strong>Next step</strong><p style="margin:8px 0 0">${escapeEmailHtml(content.details)}</p></div>`
		: "";

	const bodyHtml = `
		<p class="lead">Hello${safeName},</p>
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
		eyebrow: content.kind === "payment" ? "Payment update" : "Order update",
		preheader: `${content.heading} - order #${orderId}`,
		bodyHtml,
		supportEmail,
		footerNote: "You are receiving this message because your order status was genuinely updated.",
	});
}
