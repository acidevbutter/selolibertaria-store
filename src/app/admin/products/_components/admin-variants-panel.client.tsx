"use client";

import { Archive, Pencil, Plus } from "lucide-react";
import {
	ActiveCheckbox,
	Field,
	FormSection,
	InheritedVariantFields,
	SubmitButton,
	VariantFields,
	VariantPriceFields,
} from "@/app/admin/products/_components/product-form-fields";
import type { AdminStripeProductGroup } from "@/lib/admin-stripe-products";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/ui/shadcn/badge";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/ui/shadcn/dialog";
import { Input } from "@/ui/shadcn/input";

export function AdminVariantsPanel({
	group,
	locale,
	adminCurrency,
	createStripeVariantAction,
	updateStripeVariantAction,
	archiveStripeVariantAction,
}: {
	group: AdminStripeProductGroup;
	locale: string;
	adminCurrency: string;
	createStripeVariantAction: (formData: FormData) => Promise<void>;
	updateStripeVariantAction: (formData: FormData) => Promise<void>;
	archiveStripeVariantAction: (formData: FormData) => Promise<void>;
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
					<div className="text-sm text-muted-foreground">
						{group.variants.length} {group.variants.length === 1 ? "variante" : "variantes"}
					</div>
					<Dialog>
						<DialogTrigger asChild>
							<Button size="sm">
								<Plus className="h-4 w-4" />
								Adicionar variante
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>Adicionar variante</DialogTitle>
								<DialogDescription>
									Crie uma nova variante herdando os dados principais do livro e ajuste apenas os campos
									operacionais necessários.
								</DialogDescription>
							</DialogHeader>
							<form action={createStripeVariantAction} className="space-y-6">
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
										<Input
											id="stock"
											name="stock"
											defaultValue={group.stock}
											inputMode="numeric"
											className="max-w-[10rem]"
										/>
									</Field>
								</FormSection>
								<FormSection title="Preço">
									<VariantPriceFields basePrice={groupBasePrice} currency={groupCurrency} locale={locale} />
								</FormSection>
								<ActiveCheckbox defaultChecked />
								<DialogFooter>
									<Button type="submit">
										<Plus className="h-4 w-4" />
										Adicionar variante
									</Button>
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
						<Card key={variant.id}>
							<CardHeader>
								<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
									<div className="space-y-2">
										<CardTitle>{variant.variantLabel || group.name}</CardTitle>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant={variant.active ? "secondary" : "outline"}>
												{variant.active ? "Ativa" : "Inativa"}
											</Badge>
											<Badge variant="outline">{usesCustomPrice ? "Preço próprio" : "Preço do livro"}</Badge>
										</div>
									</div>
									<div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
										<div>
											<div className="text-xs uppercase tracking-wide">Preço</div>
											<div className="font-medium text-foreground">{priceLabel}</div>
										</div>
										<div>
											<div className="text-xs uppercase tracking-wide">Estoque</div>
											<div className="font-medium text-foreground">{variant.stock || "Não informado"}</div>
										</div>
										<div>
											<div className="text-xs uppercase tracking-wide">Ordem</div>
											<div className="font-medium text-foreground">
												{variant.variantOrder || "Ordem automática"}
											</div>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
								<div className="space-y-1 text-sm text-muted-foreground">
									<div>{variant.description || "Usa a descrição do livro."}</div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Dialog>
										<DialogTrigger asChild>
											<Button variant="outline" size="sm">
												<Pencil className="h-4 w-4" />
												Editar variante
											</Button>
										</DialogTrigger>
										<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
											<DialogHeader>
												<DialogTitle>Editar variante</DialogTitle>
												<DialogDescription>
													Revise estoque, ordem, preço e disponibilidade desta variante sem alterar os dados
													compartilhados do livro.
												</DialogDescription>
											</DialogHeader>
											<form action={updateStripeVariantAction} className="space-y-6">
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
															<Input
																id={`stock-${variant.id}`}
																name="stock"
																defaultValue={variant.stock}
																inputMode="numeric"
																className="max-w-[10rem]"
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
									<form action={archiveStripeVariantAction}>
										<input type="hidden" name="productId" value={variant.id} />
										<input type="hidden" name="currentSlug" value={group.slug} />
										<Button type="submit" variant="outline" size="sm">
											<Archive className="h-4 w-4" />
											Arquivar variante
										</Button>
									</form>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</section>
	);
}
