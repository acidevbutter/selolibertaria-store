import { emailButtonHtml, emailShellHtml, escapeEmailHtml } from "./shell";

type Props = {
	name?: string;
	verifyUrl: string;
	supportEmail?: string;
};

export function confirmationEmailHtml({ name, verifyUrl, supportEmail }: Props) {
	const safeName = name ? ` ${escapeEmailHtml(name)}` : "";
	const button = emailButtonHtml({ href: verifyUrl, label: "Verify email" });
	const bodyHtml = `
		<p class="lead">Hello${safeName},</p>
		<p>Thanks for joining Ratoeira77. Confirm your email address to activate your account and receive order updates.</p>
		<div class="note-card">
			<strong>Why this matters</strong>
			<p style="margin:8px 0 0">Your account stays protected and we can keep you informed about orders, payments and shipping updates.</p>
		</div>
		<p class="cta-wrap">${button}</p>
		<p>If the button does not work, copy and paste this link into your browser:</p>
		<div class="link-block">${escapeEmailHtml(verifyUrl)}</div>
		<p style="margin-top:18px">If you did not create an account, you can ignore this message.</p>
	`;

	return emailShellHtml({
		title: "Confirm your email",
		eyebrow: "Account access",
		preheader: "Confirm your email to activate your Ratoeira77 account.",
		bodyHtml,
		supportEmail,
		footerNote: "Automated security message sent by Ratoeira77 to protect your account.",
	});
}
