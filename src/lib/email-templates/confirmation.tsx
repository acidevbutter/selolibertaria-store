import { emailButtonHtml, emailShellHtml, escapeEmailHtml } from "./shell";

type Props = {
	name?: string;
	verifyUrl: string;
	supportEmail?: string;
	baseUrl?: string;
};

export function confirmationEmailHtml({ name, verifyUrl, supportEmail, baseUrl }: Props) {
	const safeName = name ? ` ${escapeEmailHtml(name)}` : "";
	const button = emailButtonHtml({ href: verifyUrl, label: "Confirmar e-mail" });
	const bodyHtml = `
		<p class="lead">Olá${safeName},</p>
		<p>Obrigada por entrar no Selo Libertária. Confirme seu endereço de e-mail para ativar sua conta e receber atualizações sobre pedidos.</p>
		<div class="note-card">
			<strong>Por que isso importa</strong>
			<p style="margin:8px 0 0">Sua conta fica protegida e nós conseguimos manter você informada sobre pedidos, pagamentos e atualizações de envio.</p>
		</div>
		<p class="cta-wrap">${button}</p>
		<p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
		<div class="link-block">${escapeEmailHtml(verifyUrl)}</div>
		<p style="margin-top:18px">Se você não criou uma conta, pode ignorar esta mensagem.</p>
	`;

	return emailShellHtml({
		title: "Confirme seu e-mail",
		eyebrow: "Acesso à conta",
		preheader: "Confirme seu e-mail para ativar sua conta do Selo Libertária.",
		bodyHtml,
		supportEmail,
		baseUrl,
		footerNote: "Mensagem automática de segurança enviada pelo Selo Libertária para proteger sua conta.",
	});
}
