import { emailButtonHtml, emailShellHtml, escapeEmailHtml } from "./shell";

type Props = { name?: string; resetUrl: string; supportEmail?: string };

export function passwordResetEmailHtml({ name, resetUrl, supportEmail }: Props) {
	const safeName = name ? ` ${escapeEmailHtml(name)}` : "";
	const button = emailButtonHtml({ href: resetUrl, label: "Reset password" });
	const bodyHtml = `
		<p class="lead">Hello${safeName},</p>
		<p>We received a request to reset your password. Click the button below to continue. If this was not you, ignore this email and your password will stay the same.</p>
		<div class="info-card">
			<strong>Security note</strong>
			<p style="margin:8px 0 0">For your safety, use the button below as soon as possible and avoid sharing this link with anyone else.</p>
		</div>
		<p class="cta-wrap">${button}</p>
		<p>If the button does not work, copy and paste this link into your browser:</p>
		<div class="link-block">${escapeEmailHtml(resetUrl)}</div>
	`;

	return emailShellHtml({
		title: "Reset your password",
		eyebrow: "Secure access",
		preheader: "Use this secure link to reset your Ratoeira77 password.",
		bodyHtml,
		supportEmail,
		footerNote: "If you did not request this action, nothing changes until this link is actually used.",
	});
}
