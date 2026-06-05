import { emailButtonHtml, emailShellHtml, escapeEmailHtml } from "./shell";

type Props = { name?: string; resetUrl: string; supportEmail?: string };

export function passwordResetEmailHtml({ name, resetUrl, supportEmail }: Props) {
	const safeName = name ? ` ${escapeEmailHtml(name)}` : "";
	const button = emailButtonHtml({ href: resetUrl, label: "Redefinir senha" });
	const bodyHtml = `
		<p class="lead">Olá${safeName},</p>
		<p>Recebemos um pedido para redefinir sua senha. Clique no botão abaixo para continuar. Se não foi você, ignore este e-mail e sua senha continuará a mesma.</p>
		<div class="info-card">
			<strong>Aviso de segurança</strong>
			<p style="margin:8px 0 0">Para sua segurança, use o botão abaixo o quanto antes e evite compartilhar este link com qualquer outra pessoa.</p>
		</div>
		<p class="cta-wrap">${button}</p>
		<p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
		<div class="link-block">${escapeEmailHtml(resetUrl)}</div>
	`;

	return emailShellHtml({
		title: "Redefina sua senha",
		eyebrow: "Acesso seguro",
		preheader: "Use este link seguro para redefinir sua senha do Selo Libertária.",
		bodyHtml,
		supportEmail,
		footerNote: "Se você não solicitou esta ação, nada muda até que este link seja realmente usado.",
	});
}
