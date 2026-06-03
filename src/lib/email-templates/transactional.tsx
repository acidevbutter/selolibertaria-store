import { emailShellHtml } from "./shell";

type Props = { title: string; bodyHtml: string; supportEmail?: string };

export function transactionalEmailHtml({ title, bodyHtml, supportEmail }: Props) {
	return emailShellHtml({
		title,
		eyebrow: "Store message",
		preheader: title,
		bodyHtml,
		supportEmail,
		footerNote: "Official transactional message from Ratoeira77.",
	});
}
