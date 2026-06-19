import { emailShellHtml } from "./shell";

type Props = { title: string; bodyHtml: string; supportEmail?: string };

export function transactionalEmailHtml({ title, bodyHtml, supportEmail }: Props) {
	return emailShellHtml({
		title,
		eyebrow: "Mensagem da loja",
		preheader: title,
		bodyHtml,
		supportEmail,
		footerNote: "Mensagem transacional oficial do Selo Libertária.",
	});
}
