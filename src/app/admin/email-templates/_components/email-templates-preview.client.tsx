"use client";

import { useMemo, useState } from "react";
import { confirmationEmailHtml } from "@/lib/email-templates/confirmation";
import { favoriteDiscountEmailHtml } from "@/lib/email-templates/favorite-discount";
import { orderStatusEmailHtml } from "@/lib/email-templates/order-status";
import { passwordResetEmailHtml } from "@/lib/email-templates/password-reset";
import { transactionalEmailHtml } from "@/lib/email-templates/transactional";
import { getCustomerOrderStatusContent } from "@/lib/order-status-notification";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";

type TemplateDefinition = {
	category: string;
	description: string;
	id: string;
	label: string;
	render: (supportEmail: string, currency: string) => string;
};

const templates: TemplateDefinition[] = [
	{
		category: "Conta",
		id: "confirmation",
		label: "Confirmação de conta",
		description: "Mensagem usada para validar o e-mail da pessoa usuária no primeiro acesso.",
		render: (supportEmail) =>
			confirmationEmailHtml({
				name: "Leitora",
				verifyUrl: "https://selolibertaria.local/verify?token=abc123",
				supportEmail,
			}),
	},
	{
		category: "Conta",
		id: "password-reset",
		label: "Redefinição de senha",
		description: "Mensagem de recuperação de acesso com link temporário.",
		render: (supportEmail) =>
			passwordResetEmailHtml({
				name: "Leitora",
				resetUrl: "https://selolibertaria.local/reset-password?token=xyz",
				supportEmail,
			}),
	},
	{
		category: "Pedido",
		id: "order-status",
		label: "Status do pedido",
		description: "Atualização automática de pagamento, envio e rastreio para o cliente.",
		render: (supportEmail, currency) => {
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
					{ name: "Ninfas do Tietê", qty: 1, unitAmount: 3990, image: "/images/ninfas-example.png" },
					{ name: "Marcador editorial", qty: 1, unitAmount: 1200, image: "/images/storefront-mark.svg" },
				],
				totalCents: 5190,
				supportEmail,
			});
		},
	},
	{
		category: "Marketing",
		id: "favorite-discount-alert",
		label: "Desconto em favorito",
		description: "Comunicação opcional disparada quando um item favoritado entra em promoção.",
		render: (supportEmail) =>
			favoriteDiscountEmailHtml({
				name: "Leitora",
				productName: "Ninfas do Tietê",
				variantLabel: "Edição brochura",
				productUrl: "https://selolibertaria.local/product/ninfas-do-tiete",
				basePrice: "R$ 129,90",
				effectivePrice: "R$ 99,90",
				promotionLabel: "Lançamento relâmpago",
				supportEmail,
			}),
	},
	{
		category: "Operação",
		id: "transactional",
		label: "Mensagem transacional",
		description: "Modelo genérico para recados internos ou comunicados aprovados.",
		render: (supportEmail) =>
			transactionalEmailHtml({
				title: "Boas-vindas ao Selo Libertária",
				bodyHtml: `<p>Olá, <strong>Leitora</strong>.</p><p>Obrigada por acompanhar o selo.</p>`,
				supportEmail,
			}),
	},
];

export function EmailTemplatesPreviewClient({
	supportEmail,
	currency,
}: {
	supportEmail: string;
	currency: string;
}) {
	const [selected, setSelected] = useState<string>(templates[0]?.id ?? "");
	const [search, setSearch] = useState("");
	const [previewVersion, setPreviewVersion] = useState(0);

	const filteredTemplates = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return templates;
		return templates.filter((template) =>
			`${template.label} ${template.description} ${template.category}`.toLowerCase().includes(query),
		);
	}, [search]);

	const selectedValue =
		filteredTemplates.find((template) => template.id === selected)?.id ?? filteredTemplates[0]?.id ?? "";
	const current = filteredTemplates.find((template) => template.id === selectedValue) ?? null;
	const html = current ? current.render(supportEmail, currency) : "";
	const currentIndex = templates.findIndex((template) => template.id === current?.id);

	return (
		<div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
			<section className="space-y-4 border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-5">
				<div className="space-y-2">
					<h2 className="editorial-serif text-2xl font-semibold">Biblioteca de modelos</h2>
					<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
						Escolha um modelo para revisar a estrutura, a copy e a assinatura.
					</p>
				</div>
				<div className="space-y-2">
					<label htmlFor="email-template-search" className="text-sm font-medium">
						Buscar modelo
					</label>
					<Input
						id="email-template-search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Conta, pedido, promoção..."
						className="rounded-none bg-white"
					/>
				</div>
				<div className="space-y-2">
					<label htmlFor="email-template-select" className="text-sm font-medium">
						Modelo em revisão
					</label>
					<select
						id="email-template-select"
						value={selectedValue}
						onChange={(event) => setSelected(event.target.value)}
						className="flex h-10 w-full rounded-none border border-[color:var(--editorial-border)] bg-white px-3 py-2 text-sm"
						disabled={filteredTemplates.length === 0}
					>
						{filteredTemplates.map((template) => (
							<option key={template.id} value={template.id}>
								{template.label}
							</option>
						))}
					</select>
				</div>
				<div className="space-y-3">
					{filteredTemplates.map((template) => {
						const active = template.id === current?.id;
						return (
							<button
								key={template.id}
								type="button"
								onClick={() => setSelected(template.id)}
								className={`w-full border px-4 py-4 text-left transition-colors ${
									active
										? "border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)]"
										: "border-[color:var(--editorial-border)] bg-white hover:border-[color:var(--editorial-muted)]"
								}`}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="space-y-2">
										<div className="flex flex-wrap items-center gap-2">
											<div className="text-sm font-semibold text-[color:var(--editorial-ink)]">
												{template.label}
											</div>
											<span className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
												{template.category}
											</span>
										</div>
										<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
											{template.description}
										</p>
									</div>
									{active ? (
										<span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
											Prévia
										</span>
									) : null}
								</div>
							</button>
						);
					})}
					{filteredTemplates.length === 0 ? (
						<div className="border border-dashed border-[color:var(--editorial-border)] bg-white px-4 py-6 text-sm text-[color:var(--editorial-muted)]">
							Nenhum modelo encontrado para essa busca.
						</div>
					) : null}
				</div>
			</section>

			<section className="space-y-4 border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)] p-5">
				<div className="flex flex-col gap-4 border-b border-[color:var(--editorial-border)] pb-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-2">
						<h2 className="editorial-serif text-2xl font-semibold">{current?.label ?? "Prévia"}</h2>
						<p className="max-w-2xl text-sm leading-6 text-[color:var(--editorial-muted)]">
							{current?.description ?? "Refine a busca ou limpe o filtro para visualizar uma prévia."}
						</p>
						{current ? (
							<div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--editorial-muted)]">
								<span className="border border-[color:var(--editorial-border)] px-2 py-1">
									{current.category}
								</span>
							</div>
						) : null}
					</div>
					<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm">
						<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
							E-mail de suporte
						</div>
						<div className="mt-2 font-medium text-[color:var(--editorial-ink)]">
							{supportEmail || "Ainda não configurado"}
						</div>
					</div>
				</div>

				<div className="flex flex-wrap gap-3">
					<Button
						type="button"
						variant="outline"
						className="rounded-none bg-white"
						onClick={() => setPreviewVersion((value) => value + 1)}
						disabled={!current}
					>
						Atualizar prévia
					</Button>
				</div>

				{current ? (
					<iframe
						key={`${current.id}:${previewVersion}:${supportEmail}`}
						title={`Prévia do modelo ${current.label}`}
						srcDoc={html}
						sandbox=""
						className="min-h-[760px] w-full border border-[color:var(--editorial-border)] bg-white"
					/>
				) : (
					<div className="grid min-h-[760px] place-items-center border border-dashed border-[color:var(--editorial-border)] bg-white px-6 text-center text-sm leading-6 text-[color:var(--editorial-muted)]">
						Nenhum modelo corresponde ao filtro atual. Limpe a busca para continuar.
					</div>
				)}
			</section>
		</div>
	);
}
