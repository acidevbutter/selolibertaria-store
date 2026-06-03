import { emailButtonHtml, emailShellHtml, escapeEmailHtml } from "./shell";

type Props = {
	name?: string | null;
	productName: string;
	variantLabel?: string | null;
	productUrl: string;
	basePrice: string;
	effectivePrice: string;
	promotionLabel: string;
	supportEmail?: string;
};

export function favoriteDiscountEmailHtml({
	name,
	productName,
	variantLabel,
	productUrl,
	basePrice,
	effectivePrice,
	promotionLabel,
	supportEmail,
}: Props) {
	const greeting = name ? `Hello, ${escapeEmailHtml(name)}.` : "Hello.";
	const variantHtml = variantLabel
		? `<p class="note-card"><strong>Favorited variant</strong><br />${escapeEmailHtml(variantLabel)}</p>`
		: "";
	const bodyHtml = `
		<p class="lead">${greeting}</p>
		<p>An item from your favorites list just went on sale at Ratoeira77 Store.</p>
		<span class="status-pill">${escapeEmailHtml(promotionLabel)}</span>
		<div class="meta-grid">
			<div class="meta-box">
				<span class="meta-label">Product</span>
				<span class="meta-value">${escapeEmailHtml(productName)}</span>
			</div>
			<div class="meta-box">
				<span class="meta-label">New price</span>
				<span class="meta-value grunge">${escapeEmailHtml(effectivePrice)}</span>
			</div>
		</div>
		<div class="info-card">
			<strong>Previous price</strong>
			<p style="margin:8px 0 0">${escapeEmailHtml(basePrice)}</p>
		</div>
		${variantHtml}
		<div class="cta-wrap">
			${emailButtonHtml({ href: productUrl, label: "View product" })}
		</div>
		<div class="link-block">
			If you no longer want to receive discount alerts for favorited items, go to your profile and disable
			promotional emails.
		</div>
	`;

	return emailShellHtml({
		title: "Your favorite item is on sale",
		eyebrow: "Favorite alert",
		preheader: `${productName} is now discounted`,
		bodyHtml,
		supportEmail,
		footerNote: "You are receiving this email because promotional alerts are enabled on your account.",
	});
}
