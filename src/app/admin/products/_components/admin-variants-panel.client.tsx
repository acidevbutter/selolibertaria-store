"use client";

import { Archive, Pencil, Plus } from "lucide-react";
import { StatusBadge } from "@/app/admin/_components/ui/StatusBadge";
import {
	ActiveCheckbox,
	Field,
	FormSection,
	InheritedVariantFields,
	SubmitButton,
	VariantFields,
	VariantPriceFields,
} from "@/app/admin/products/_components/product-form-fields";
import type { AdminProductGroup } from "@/lib/admin-products";
import { formatMoney } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/ui/shadcn/dialog";
import { SlButton } from "@/ui/sl/sl-button";

const fieldClassName =
	"h-[var(--sl-h-button)] w-full max-w-[10rem] border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-4 text-sm text-[var(--sl-ink)] outline-none placeholder:text-[color:var(--sl-text-disabled)]";
const fieldStyle = { borderRadius: "var(--sl-radius)" } as const;
const triggerButtonStyle = { height: "var(--sl-h-small)", padding: "0 16px", fontSize: "11px" } as const;

export function AdminVariantsPanel({
	group,
	locale,
	adminCurrency,
	createVariantAction,
	updateVariantAction,
	archiveVariantAction,
}: {
	group: AdminProductGroup;
	locale: string;
	adminCurrency: string;
	createVariantAction: (formData: FormData) => Promise<void>;
	updateVariantAction: (formData: FormData) => Promise<void>;
	archiveVariantAction: (formData: FormData) => Promise<void>;
}) {
	const groupBasePrice = group.variants[0]?.priceDecimal ?? null;
	const groupCurrency = group.variants[0]?.currency ?? adminCurrency;

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold">Variantes</h2>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-sm text-[var(--sl-text-muted)]">
						{group.variants.length} {group.variants.length === 1 ? "variante" : "variantes"}
					</div>
					<Dialog>
						<DialogTrigger asChild>
							<button type="button" className="sl-btn sl-btn-primary gap-2" style={triggerButtonStyle}>
								<Plus className="h-4 w-4" />
								Adicionar variante
							</button>
						</DialogTrigger>
						<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>Adicionar variante</DialogTitle>
								<DialogDescription>
									Crie uma nova variante herdando os dados principais do produto e ajuste apenas os campos
									operacionais necessários.
								</DialogDescription>
							</DialogHeader>
							<form action={createVariantAction} className="space-y-6">
								<input type="hidden" name="currentSlug" value={group.slug} />
								<InheritedVariantFields
									name={group.name}
									slug={group.slug}
									category={group.category}
									description={group.description}
									images={group.images}
								/>
								<FormSection title="Dados da variante">
									<VariantFields />
									<Field label="Estoque" name="stock" hint="Use um número inteiro, como 25.">
										<input
											id="stock"
											name="stock"
											defaultValue={group.stock}
											inputMode="numeric"
											className={fieldClassName}
											style={fieldStyle}
										/>
									</Field>
								</FormSection>
								<FormSection title="Preço">
									<VariantPriceFields basePrice={groupBasePrice} currency={groupCurrency} locale={locale} />
								</FormSection>
								<ActiveCheckbox defaultChecked />
								<DialogFooter>
									<SubmitButton>Adicionar variante</SubmitButton>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<div className="grid gap-4">
				{group.variants.map((variant) => {
					const usesCustomPrice =
						typeof variant.priceDecimal === "number" &&
						typeof groupBasePrice === "number" &&
						variant.priceDecimal !== groupBasePrice;
					const priceLabel =
						typeof variant.priceAmount === "number"
							? formatMoney({ amount: variant.priceAmount, currency: variant.currency, locale })
							: "Sem preço";

					return (
						<div
							key={variant.id}
							className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)]"
							style={fieldStyle}
						>
							<div className="p-5">
								<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
									<div className="space-y-2">
										<div className="text-lg font-semibold">{variant.variantLabel || group.name}</div>
										<div className="flex flex-wrap items-center gap-2">
											<StatusBadge tone={variant.active ? "active" : "alert"}>
												{variant.active ? "Ativa" : "Inativa"}
											</StatusBadge>
											<StatusBadge tone="neutral">
												{usesCustomPrice ? "Preço próprio" : "Preço do produto"}
											</StatusBadge>
										</div>
									</div>
									<div className="grid gap-3 text-sm text-[var(--sl-text-muted)] sm:grid-cols-3">
										<div>
											<div className="text-xs uppercase tracking-wide">Preço</div>
											<div className="font-medium text-[var(--sl-ink)]">{priceLabel}</div>
										</div>
										<div>
											<div className="text-xs uppercase tracking-wide">Estoque</div>
											<div className="font-medium text-[var(--sl-ink)]">
												{variant.stock || "Não informado"}
											</div>
										</div>
										<div>
											<div className="text-xs uppercase tracking-wide">Ordem</div>
											<div className="font-medium text-[var(--sl-ink)]">
												{variant.variantOrder || "Ordem automática"}
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="flex flex-col gap-3 border-t border-[var(--sl-line)] p-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
								<div className="space-y-1 text-sm text-[var(--sl-text-muted)]">
									<div>{variant.description || "Usa a descrição do produto."}</div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Dialog>
										<DialogTrigger asChild>
											<button
												type="button"
												className="sl-btn sl-btn-secondary gap-2"
												style={triggerButtonStyle}
											>
												<Pencil className="h-4 w-4" />
												Editar variante
											</button>
										</DialogTrigger>
										<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
											<DialogHeader>
												<DialogTitle>Editar variante</DialogTitle>
												<DialogDescription>
													Revise estoque, ordem, preço e disponibilidade desta variante sem alterar os dados
													compartilhados do produto.
												</DialogDescription>
											</DialogHeader>
											<form action={updateVariantAction} className="space-y-6">
												<input type="hidden" name="productId" value={variant.id} />
												<input type="hidden" name="currentSlug" value={group.slug} />
												<InheritedVariantFields
													name={group.name}
													slug={group.slug}
													category={group.category}
													description={group.description}
													images={group.images}
												/>
												<FormSection title="Dados da variante">
													<div className="grid gap-4 md:grid-cols-2">
														<Field
															label="Estoque"
															name={`stock-${variant.id}`}
															hint="Use um número inteiro, como 25."
														>
															<input
																id={`stock-${variant.id}`}
																name="stock"
																defaultValue={variant.stock}
																inputMode="numeric"
																className={fieldClassName}
																style={fieldStyle}
															/>
														</Field>
													</div>
													<VariantFields variant={variant.variantLabel} variantOrder={variant.variantOrder} />
												</FormSection>
												<FormSection title="Preço">
													<VariantPriceFields
														basePrice={groupBasePrice}
														currency={groupCurrency}
														locale={locale}
														overridePrice={usesCustomPrice ? variant.priceDecimal : null}
													/>
												</FormSection>
												<ActiveCheckbox defaultChecked={variant.active} />
												<DialogFooter>
													<SubmitButton>Salvar variante</SubmitButton>
												</DialogFooter>
											</form>
										</DialogContent>
									</Dialog>
									<form action={archiveVariantAction}>
										<input type="hidden" name="productId" value={variant.id} />
										<input type="hidden" name="currentSlug" value={group.slug} />
										<SlButton type="submit" variant="secondary" size="sm">
											<Archive className="h-4 w-4" />
											Arquivar variante
										</SlButton>
									</form>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}
