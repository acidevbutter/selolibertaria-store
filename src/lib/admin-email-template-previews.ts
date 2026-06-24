import { confirmationEmailHtml } from "@/lib/email-templates/confirmation";
import { favoriteDiscountEmailHtml } from "@/lib/email-templates/favorite-discount";
import { orderStatusEmailHtml } from "@/lib/email-templates/order-status";
import { passwordResetEmailHtml } from "@/lib/email-templates/password-reset";
import { transactionalEmailHtml } from "@/lib/email-templates/transactional";
import { getCustomerOrderStatusContent } from "@/lib/order-status-notification";

export type EmailTemplatePreviewContext = {
	supportEmail: string;
	currency: string;
	baseUrl: string;
};

export type EmailTemplatePreviewVariable = {
	name: string;
	example: string;
};

export type EmailTemplatePreviewDefinition = {
	category: string;
	description: string;
	id: string;
	label: string;
	testSubject: string;
	variables: EmailTemplatePreviewVariable[];
	render: (context: EmailTemplatePreviewContext) => string;
};

export const emailTemplatePreviewDefinitions: EmailTemplatePreviewDefinition[] = [
	{
		category: "Conta",
		id: "confirmation",
		label: "Confirmação de conta",
		description: "Mensagem usada para validar o e-mail da pessoa usuária no primeiro acesso.",
		testSubject: "Confirme sua conta no Selo Libertária",
		variables: [
			{ name: "name", example: "Leitora" },
			{ name: "verifyUrl", example: "https://selolibertaria.local/verify?token=abc123" },
			{ name: "supportEmail", example: "contato@selolibertaria.com" },
		],
		render: ({ supportEmail, baseUrl }) =>
			confirmationEmailHtml({
				name: "Leitora",
				verifyUrl: "https://selolibertaria.local/verify?token=abc123",
				supportEmail,
				baseUrl,
			}),
	},
	{
		category: "Conta",
		id: "password-reset",
		label: "Redefinição de senha",
		description: "Mensagem de recuperação de acesso com link temporário.",
		testSubject: "Redefina sua senha no Selo Libertária",
		variables: [
			{ name: "name", example: "Leitora" },
			{ name: "resetUrl", example: "https://selolibertaria.local/reset-password?token=xyz" },
			{ name: "supportEmail", example: "contato@selolibertaria.com" },
		],
		render: ({ supportEmail, baseUrl }) =>
			passwordResetEmailHtml({
				name: "Leitora",
				resetUrl: "https://selolibertaria.local/reset-password?token=xyz",
				supportEmail,
				baseUrl,
			}),
	},
	{
		category: "Pedido",
		id: "order-status",
		label: "Status do pedido",
		description: "Atualização automática de pagamento, envio e rastreio para o cliente.",
		testSubject: "Seu pedido foi atualizado",
		variables: [
			{ name: "orderId", example: "1001" },
			{ name: "status", example: "Enviado" },
			{ name: "trackingNumber", example: "BR123456789" },
			{ name: "currency", example: "BRL" },
			{ name: "supportEmail", example: "contato@selolibertaria.com" },
		],
		render: ({ supportEmail, currency, baseUrl }) => {
			const content = getCustomerOrderStatusContent({
				status: "shipped",
				trackingNumber: "BR123456789",
			});
			if (!content) return "";
			return orderStatusEmailHtml({
				name: "Leitora",
				orderId: "1001",
				content,
				currency,
				fulfillment: { status: "shipped", trackingNumber: "BR123456789" },
				items: [
					{
						name: "Virus do Beijo",
						qty: 1,
						unitAmount: 3990,
						image: "/images/selolibertaria/virus-do-beijo-cover.png",
					},
					{ name: "Marcador editorial", qty: 1, unitAmount: 1200, image: "/images/selolibertaria.png" },
				],
				totalCents: 5190,
				supportEmail,
				baseUrl,
			});
		},
	},
	{
		category: "Marketing",
		id: "favorite-discount-alert",
		label: "Desconto em favorito",
		description: "Comunicação opcional disparada quando um item favoritado entra em promoção.",
		testSubject: "Um favorito seu entrou em promoção",
		variables: [
			{ name: "productName", example: "Ninfas do Tietê" },
			{ name: "variantLabel", example: "Edição brochura" },
			{ name: "basePrice", example: "R$ 129,90" },
			{ name: "effectivePrice", example: "R$ 99,90" },
			{ name: "promotionLabel", example: "Lançamento relâmpago" },
		],
		render: ({ supportEmail, baseUrl }) =>
			favoriteDiscountEmailHtml({
				name: "Leitora",
				productName: "Ninfas do Tietê",
				variantLabel: "Edição brochura",
				productUrl: "https://selolibertaria.local/product/ninfas-do-tiete",
				basePrice: "R$ 129,90",
				effectivePrice: "R$ 99,90",
				promotionLabel: "Lançamento relâmpago",
				supportEmail,
				baseUrl,
			}),
	},
	{
		category: "Operação",
		id: "transactional",
		label: "Mensagem transacional",
		description: "Modelo genérico para recados internos ou comunicados aprovados.",
		testSubject: "Mensagem do Selo Libertária",
		variables: [
			{ name: "title", example: "Boas-vindas ao Selo Libertária" },
			{ name: "bodyHtml", example: "Obrigada por acompanhar o selo." },
			{ name: "supportEmail", example: "contato@selolibertaria.com" },
		],
		render: ({ supportEmail, baseUrl }) =>
			transactionalEmailHtml({
				title: "Boas-vindas ao Selo Libertária",
				bodyHtml: `<p>Olá, <strong>Leitora</strong>.</p><p>Obrigada por acompanhar o selo.</p>`,
				supportEmail,
				baseUrl,
			}),
	},
];

export function getEmailTemplatePreviewDefinition(templateId: string) {
	return emailTemplatePreviewDefinitions.find((template) => template.id === templateId) ?? null;
}
