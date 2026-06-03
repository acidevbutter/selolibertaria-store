type EmailShellOptions = {
	title: string;
	bodyHtml: string;
	preheader?: string;
	eyebrow?: string;
	supportEmail?: string;
	footerNote?: string;
};

export function escapeEmailHtml(value: unknown) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function emailButtonHtml({ href, label }: { href: string; label: string }) {
	return `<a class="cta-button" href="${escapeEmailHtml(href)}">${escapeEmailHtml(label)}</a>`;
}

export function emailShellHtml({
	title,
	bodyHtml,
	preheader,
	eyebrow,
	supportEmail,
	footerNote,
}: EmailShellOptions) {
	const year = new Date().getFullYear();
	const safeSupport = escapeEmailHtml(supportEmail ?? "contact@ratoeira77.store");
	const safeTitle = escapeEmailHtml(title);
	const safeEyebrow = escapeEmailHtml(eyebrow ?? "Ratoeira77");
	const safeFooterNote = footerNote ? escapeEmailHtml(footerNote) : "";
	const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
	const logoUrl = `${baseUrl}/images/ratoeira/ratoeira-red.jpg`;
	const titleFontUrl = `${baseUrl}/fonts/VtksUrticaria-gx3wp.ttf`;
	const grungeFontUrl = `${baseUrl}/fonts/SimpleGrunge-p7aDD.otf`;
	const preheaderHtml = preheader
		? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeEmailHtml(preheader)}</div>`
		: "";

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width,initial-scale=1" />
		<style>
			@font-face {
				font-family: "Vtks Urticaria";
				src: url("${escapeEmailHtml(titleFontUrl)}") format("truetype");
				font-weight: 400;
				font-style: normal;
				font-display: swap;
			}
			@font-face {
				font-family: "SimpleGrunge";
				src: url("${escapeEmailHtml(grungeFontUrl)}") format("opentype");
				font-weight: 400;
				font-style: normal;
				font-display: swap;
			}
			body {
				margin: 0;
				padding: 24px 16px;
				background:
					radial-gradient(circle at top, rgba(185, 28, 28, 0.18), transparent 30%),
					linear-gradient(180deg, #050505 0%, #0b0b0b 100%);
				color: #f5f5f5;
				font-family:
					Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
			}
			a {
				color: inherit;
				text-decoration: none;
			}
			.container {
				max-width: 680px;
				margin: 0 auto;
				background: linear-gradient(180deg, #101010 0%, #080808 100%);
				border: 1px solid rgba(185, 28, 28, 0.35);
				border-radius: 22px;
				overflow: hidden;
				box-shadow:
					0 20px 60px rgba(0, 0, 0, 0.55),
					0 0 0 1px rgba(255, 255, 255, 0.03) inset;
			}
			.edge {
				height: 10px;
				background-image: repeating-linear-gradient(90deg, #b91c1c 0 18px, transparent 18px 32px);
			}
			.hero {
				padding: 28px 28px 22px;
				background:
					radial-gradient(circle at top right, rgba(185, 28, 28, 0.35), transparent 34%),
					linear-gradient(180deg, rgba(127, 29, 29, 0.22), transparent 75%);
				border-bottom: 1px solid rgba(255, 255, 255, 0.06);
			}
			.brand-row {
				display: flex;
				align-items: center;
				gap: 16px;
			}
			.logo-wrap {
				width: 72px;
				height: 72px;
				border-radius: 18px;
				display: flex;
				align-items: center;
				justify-content: center;
				background: linear-gradient(180deg, rgba(185, 28, 28, 0.2), rgba(255, 255, 255, 0.02));
				border: 1px solid rgba(185, 28, 28, 0.45);
				box-shadow: 0 8px 24px rgba(127, 29, 29, 0.28);
			}
			.logo-wrap img {
				width: 52px;
				height: 52px;
				object-fit: contain;
			}
			.eyebrow {
				margin: 0 0 6px;
				color: #fca5a5;
				font-size: 11px;
				font-weight: 700;
				letter-spacing: 0.28em;
				text-transform: uppercase;
			}
			.hero-title {
				margin: 0;
				color: #fff7ed;
				font-family:
					"Vtks Urticaria", Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
				font-size: 34px;
				line-height: 0.98;
				letter-spacing: 0.02em;
			}
			.content {
				padding: 28px;
				color: #f5f5f5;
				line-height: 1.7;
				font-size: 15px;
			}
			.content p {
				margin: 0 0 14px;
			}
			.lead {
				color: #e7e5e4;
				font-size: 16px;
			}
			.note-card,
			.info-card {
				margin: 18px 0;
				padding: 18px;
				border-radius: 18px;
				background: rgba(255, 255, 255, 0.03);
				border: 1px solid rgba(255, 255, 255, 0.08);
			}
			.note-card strong,
			.info-card strong {
				color: #fff7ed;
			}
			.cta-wrap {
				margin: 24px 0 18px;
			}
			.cta-button {
				display: inline-block;
				padding: 14px 24px;
				border-radius: 999px;
				background: linear-gradient(180deg, #dc2626 0%, #991b1b 100%);
				border: 1px solid rgba(254, 202, 202, 0.32);
				color: #fff7ed !important;
				font-weight: 700;
				letter-spacing: 0.04em;
				text-transform: uppercase;
				box-shadow: 0 12px 30px rgba(127, 29, 29, 0.35);
			}
			.link-block {
				margin-top: 18px;
				padding: 14px 16px;
				border-radius: 14px;
				background: rgba(255, 255, 255, 0.02);
				border: 1px dashed rgba(252, 165, 165, 0.24);
				color: #d6d3d1;
				font-size: 13px;
				word-break: break-word;
			}
			.status-pill {
				display: inline-block;
				margin: 8px 0 14px;
				padding: 8px 12px;
				border-radius: 999px;
				background: rgba(185, 28, 28, 0.16);
				border: 1px solid rgba(248, 113, 113, 0.22);
				color: #fecaca;
				font-size: 12px;
				font-weight: 700;
				letter-spacing: 0.08em;
				text-transform: uppercase;
			}
			.meta-grid {
				margin: 18px 0;
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 12px;
			}
			.meta-box {
				padding: 14px 16px;
				border-radius: 16px;
				background: rgba(255, 255, 255, 0.03);
				border: 1px solid rgba(255, 255, 255, 0.08);
			}
			.meta-label {
				display: block;
				margin-bottom: 6px;
				color: #a8a29e;
				font-size: 11px;
				font-weight: 700;
				letter-spacing: 0.12em;
				text-transform: uppercase;
			}
			.meta-value {
				color: #fff7ed;
				font-size: 16px;
				font-weight: 700;
			}
			.meta-value.grunge {
				font-family:
					"SimpleGrunge", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
				letter-spacing: 0.04em;
			}
			.progress {
				margin: 22px 0 20px;
			}
			.progress-rail {
				height: 10px;
				border-radius: 999px;
				background: rgba(255, 255, 255, 0.08);
				overflow: hidden;
			}
			.progress-fill {
				height: 10px;
				border-radius: 999px;
				background: linear-gradient(90deg, #7f1d1d 0%, #dc2626 100%);
			}
			.progress-labels {
				display: flex;
				justify-content: space-between;
				gap: 8px;
				margin-top: 10px;
				color: #a8a29e;
				font-size: 12px;
				text-transform: uppercase;
				letter-spacing: 0.08em;
			}
			.items-table {
				width: 100%;
				margin-top: 22px;
				border-collapse: separate;
				border-spacing: 0 10px;
			}
			.item-row td {
				padding: 14px 16px;
				background: rgba(255, 255, 255, 0.03);
				border-top: 1px solid rgba(255, 255, 255, 0.06);
				border-bottom: 1px solid rgba(255, 255, 255, 0.06);
			}
			.item-row td:first-child {
				border-left: 1px solid rgba(255, 255, 255, 0.06);
				border-radius: 16px 0 0 16px;
			}
			.item-row td:last-child {
				border-right: 1px solid rgba(255, 255, 255, 0.06);
				border-radius: 0 16px 16px 0;
				text-align: right;
				white-space: nowrap;
			}
			.item-title {
				color: #fff7ed;
				font-weight: 700;
			}
			.item-meta {
				margin-top: 4px;
				color: #a8a29e;
				font-size: 12px;
				text-transform: uppercase;
				letter-spacing: 0.08em;
			}
			.item-image {
				width: 56px;
				height: 56px;
				border-radius: 14px;
				object-fit: cover;
				border: 1px solid rgba(255, 255, 255, 0.08);
				background: #111111;
			}
			.total-box {
				margin-top: 22px;
				padding: 18px;
				border-radius: 18px;
				background: linear-gradient(180deg, rgba(185, 28, 28, 0.14), rgba(255, 255, 255, 0.02));
				border: 1px solid rgba(185, 28, 28, 0.34);
				text-align: right;
			}
			.total-label {
				color: #fca5a5;
				font-size: 11px;
				font-weight: 700;
				letter-spacing: 0.18em;
				text-transform: uppercase;
			}
			.total-value {
				display: block;
				margin-top: 6px;
				color: #fff7ed;
				font-family:
					"SimpleGrunge", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
				font-size: 28px;
				line-height: 1;
			}
			.divider {
				height: 1px;
				margin: 0 28px;
				background: linear-gradient(90deg, transparent 0%, rgba(185, 28, 28, 0.7) 50%, transparent 100%);
			}
			.footer {
				padding: 20px 28px 24px;
				color: #a8a29e;
				font-size: 12px;
			}
			.footer-row {
				display: flex;
				flex-wrap: wrap;
				align-items: center;
				justify-content: space-between;
				gap: 10px 16px;
				text-transform: uppercase;
				letter-spacing: 0.12em;
			}
			.footer-link {
				color: #fca5a5 !important;
			}
			.footer-note {
				margin-top: 12px;
				color: #78716c;
				font-size: 12px;
				line-height: 1.6;
				text-transform: none;
				letter-spacing: 0;
			}
			@media (max-width: 640px) {
				body {
					padding: 12px;
				}
				.hero,
				.content,
				.footer {
					padding-left: 20px;
					padding-right: 20px;
				}
				.divider {
					margin: 0 20px;
				}
				.brand-row {
					align-items: flex-start;
				}
				.hero-title {
					font-size: 28px;
				}
				.meta-grid {
					grid-template-columns: 1fr;
				}
				.item-row td {
					display: block;
					width: auto;
				}
				.item-row td:first-child,
				.item-row td:last-child {
					border-radius: 16px;
				}
				.item-row td:last-child {
					margin-top: 8px;
				}
			}
		</style>
	</head>
	<body>
		${preheaderHtml}
		<div class="container">
			<div class="edge"></div>
			<div class="hero">
				<div class="brand-row">
					<div class="logo-wrap">
						<img src="${escapeEmailHtml(logoUrl)}" alt="Ratoeira77" />
					</div>
					<div>
						<p class="eyebrow">${safeEyebrow}</p>
						<h1 class="hero-title">${safeTitle}</h1>
					</div>
				</div>
			</div>
			<div class="content">${bodyHtml}</div>
			<div class="divider"></div>
			<div class="footer">
				<div class="footer-row">
					<span>© ${year} Ratoeira77</span>
					<a class="footer-link" href="mailto:${safeSupport}">${safeSupport}</a>
				</div>
				${safeFooterNote ? `<p class="footer-note">${safeFooterNote}</p>` : ""}
			</div>
			<div class="edge"></div>
		</div>
	</body>
</html>`;
}
