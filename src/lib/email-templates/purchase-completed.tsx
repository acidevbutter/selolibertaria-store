import { emailButtonHtml, emailShellHtml, escapeEmailHtml } from "./shell";

type Props = {
	name?: string | null;
	orderId: string;
	accountUrl: string;
	items: Array<{ name: string; quantity: number; price?: string }>;
	total?: string;
	supportEmail?: string;
	baseUrl?: string;
};

export function purchaseCompletedEmailHtml({
	name,
	orderId,
	accountUrl,
	items,
	total,
	supportEmail,
	baseUrl,
}: Props) {
	const greeting = name ? `Olá, ${escapeEmailHtml(name)}.` : "Olá.";
	const itemsHtml = items
		.map(
			(item) => `
				<tr class="item-row">
					<td>
						<strong>${escapeEmailHtml(item.name)}</strong><br />
						<span style="color:#64748b">Quantidade: ${escapeEmailHtml(item.quantity)}</span>
					</td>
					<td align="right">${escapeEmailHtml(item.price ?? "")}</td>
				</tr>
			`,
		)
		.join("");

	const totalHtml = total
		? `
			<div class="meta-grid">
				<div class="meta-box">
					<span class="meta-label">Pedido</span>
					<span class="meta-value">#${escapeEmailHtml(orderId)}</span>
				</div>
				<div class="meta-box">
					<span class="meta-label">Total</span>
					<span class="meta-value">${escapeEmailHtml(total)}</span>
				</div>
			</div>
		`
		: `
			<div class="meta-grid">
				<div class="meta-box">
					<span class="meta-label">Pedido</span>
					<span class="meta-value">#${escapeEmailHtml(orderId)}</span>
				</div>
			</div>
		`;

	const bodyHtml = `
		<p class="lead">${greeting}</p>
		<p>Sua compra foi confirmada no Selo Libertária.</p>
		<span class="status-pill">Compra concluída</span>
		${totalHtml}
		<div class="info-card">
			<strong>Resumo do pedido</strong>
			<table class="items-table" role="presentation">${itemsHtml}</table>
		</div>
		<div class="cta-wrap">
			${emailButtonHtml({ href: accountUrl, label: "Acessar minha conta" })}
		</div>
		<div class="note-card">
			<strong>Primeiro acesso</strong>
			<p style="margin:8px 0 0">Se você ainda não tem senha, poderá criá-la no primeiro acesso.</p>
		</div>
	`;

	return emailShellHtml({
		title: "Compra concluída",
		eyebrow: "Selo Libertária",
		preheader: `Compra concluída - pedido #${orderId}`,
		bodyHtml,
		supportEmail,
		baseUrl,
		footerNote: "Você está recebendo esta mensagem porque um pedido foi confirmado com este e-mail.",
	});
}
