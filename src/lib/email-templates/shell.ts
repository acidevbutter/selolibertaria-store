import { seloSiteMeta } from "@/lib/selolibertaria-content";

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
	const safeSupport = escapeEmailHtml(supportEmail ?? seloSiteMeta.email);
	const safeTitle = escapeEmailHtml(title);
	const safeEyebrow = escapeEmailHtml(eyebrow ?? seloSiteMeta.name);
	const safeFooterNote = footerNote ? escapeEmailHtml(footerNote) : "";
	const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
	const logoUrl = `${baseUrl}/images/selolibertaria.png`;
	const preheaderHtml = preheader
		? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeEmailHtml(preheader)}</div>`
		: "";

	return `<!doctype html>
<html lang="pt-BR">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width,initial-scale=1" />
		<style>
			body {
				margin: 0;
				padding: 24px 16px;
				background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
				color: #0f172a;
				font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
			}
			a {
				color: inherit;
				text-decoration: none;
			}
			.container {
				max-width: 680px;
				margin: 0 auto;
				background: #ffffff;
				border: 1px solid #dbe3ee;
				border-radius: 22px;
				overflow: hidden;
				box-shadow: 0 20px 60px rgba(15, 23, 42, 0.1);
			}
			.edge {
				height: 10px;
				background: linear-gradient(90deg, #111827 0%, #475569 100%);
			}
			.hero {
				padding: 28px 28px 22px;
				background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
				border-bottom: 1px solid #e2e8f0;
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
				background: #ffffff;
				border: 1px solid #dbe3ee;
				box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
			}
			.logo-wrap img {
				width: 52px;
				height: 52px;
				object-fit: contain;
			}
			.eyebrow {
				margin: 0 0 6px;
				color: #64748b;
				font-size: 11px;
				font-weight: 700;
				letter-spacing: 0.18em;
				text-transform: uppercase;
			}
			.hero-title {
				margin: 0;
				color: #0f172a;
				font-size: 34px;
				font-weight: 700;
				line-height: 1.05;
				letter-spacing: -0.02em;
			}
			.content {
				padding: 28px;
				color: #334155;
				line-height: 1.7;
				font-size: 15px;
			}
			.content p {
				margin: 0 0 14px;
			}
			.lead {
				color: #0f172a;
				font-size: 16px;
			}
			.note-card,
			.info-card {
				margin: 18px 0;
				padding: 18px;
				border-radius: 18px;
				background: #f8fafc;
				border: 1px solid #e2e8f0;
			}
			.note-card strong,
			.info-card strong {
				color: #0f172a;
			}
			.cta-wrap {
				margin: 24px 0 18px;
			}
			.cta-button {
				display: inline-block;
				padding: 14px 24px;
				border-radius: 999px;
				background: #111827;
				border: 1px solid #111827;
				color: #f8fafc !important;
				font-weight: 700;
				letter-spacing: 0.02em;
				box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
			}
			.link-block {
				margin-top: 18px;
				padding: 14px 16px;
				border-radius: 14px;
				background: #f8fafc;
				border: 1px dashed #cbd5e1;
				color: #475569;
				font-size: 13px;
				word-break: break-word;
			}
			.status-pill {
				display: inline-block;
				margin: 8px 0 14px;
				padding: 8px 12px;
				border-radius: 999px;
				background: #e2e8f0;
				border: 1px solid #cbd5e1;
				color: #334155;
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
				background: #f8fafc;
				border: 1px solid #e2e8f0;
			}
			.meta-label {
				display: block;
				margin-bottom: 6px;
				color: #64748b;
				font-size: 11px;
				font-weight: 700;
				letter-spacing: 0.12em;
				text-transform: uppercase;
			}
			.meta-value {
				color: #0f172a;
				font-size: 16px;
				font-weight: 700;
			}
			.meta-value.price-emphasis {
				font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
				letter-spacing: 0;
			}
			.progress {
				margin: 22px 0 20px;
			}
			.progress-rail {
				height: 10px;
				border-radius: 999px;
				background: #e2e8f0;
				overflow: hidden;
			}
			.progress-fill {
				height: 10px;
				border-radius: 999px;
				background: linear-gradient(90deg, #0f172a 0%, #475569 100%);
			}
			.progress-labels {
				display: flex;
				justify-content: space-between;
				gap: 8px;
				margin-top: 10px;
				color: #64748b;
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
				background: #f8fafc;
				border-top: 1px solid #e2e8f0;
				border-bottom: 1px solid #e2e8f0;
			}
			.item-row td:first-child {
				border-left: 1px solid #e2e8f0;
				border-radius: 16px 0 0 16px;
			}
			.item-row td:last-child {
				border-right: 1px solid #e2e8f0;
				border-radius: 0 16px 16px 0;
				text-align: right;
				white-space: nowrap;
			}
			.item-title {
				color: #0f172a;
				font-weight: 700;
			}
			.item-meta {
				margin-top: 4px;
				color: #64748b;
				font-size: 12px;
				text-transform: uppercase;
				letter-spacing: 0.08em;
			}
			.item-image {
				width: 56px;
				height: 56px;
				border-radius: 14px;
				object-fit: cover;
				border: 1px solid #e2e8f0;
				background: #ffffff;
			}
			.total-box {
				margin-top: 22px;
				padding: 18px;
				border-radius: 18px;
				background: #f8fafc;
				border: 1px solid #e2e8f0;
				text-align: right;
			}
			.total-label {
				color: #64748b;
				font-size: 11px;
				font-weight: 700;
				letter-spacing: 0.18em;
				text-transform: uppercase;
			}
			.total-value {
				display: block;
				margin-top: 6px;
				color: #0f172a;
				font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
				font-size: 28px;
				line-height: 1;
			}
			.divider {
				height: 1px;
				margin: 0 28px;
				background: linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%);
			}
			.footer {
				padding: 20px 28px 24px;
				color: #64748b;
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
				color: #334155 !important;
			}
			.footer-note {
				margin-top: 12px;
				color: #64748b;
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
						<img src="${escapeEmailHtml(logoUrl)}" alt="${escapeEmailHtml(seloSiteMeta.name)}" />
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
					<span>© ${year} ${escapeEmailHtml(seloSiteMeta.name)}</span>
					<a class="footer-link" href="mailto:${safeSupport}">${safeSupport}</a>
				</div>
				${safeFooterNote ? `<p class="footer-note">${safeFooterNote}</p>` : ""}
			</div>
			<div class="edge"></div>
		</div>
	</body>
</html>`;
}
