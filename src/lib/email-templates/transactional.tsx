import { emailShellHtml } from "./shell";

type Props = { title: string; bodyHtml: string; supportEmail?: string; baseUrl?: string };

export function transactionalEmailHtml({ title, bodyHtml, supportEmail, baseUrl }: Props) {
	return emailShellHtml({
		title,
		eyebrow: "Mensagem da loja",
		preheader: title,
		bodyHtml,
		supportEmail,
		baseUrl,
		footerNote: "Mensagem transacional oficial do Selo Libertária.",
	});
}
