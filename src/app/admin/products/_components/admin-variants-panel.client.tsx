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
	createStripeVariantAction,
	updateStripeVariantAction,
	archiveStripeVariantAction,
}: {
	group: AdminStripeProductGroup;
	createStripeVariantAction: (formData: FormData) => Promise<void>;
	updateStripeVariantAction: (formData: FormData) => Promise<void>;
	archiveStripeVariantAction: (formData: FormData) => Promise<void>;
}) {
	const groupBasePrice = group.variants[0]?.priceDecimal ?? null;
	const groupCurrency = group.variants[0]?.currency ?? "usd";

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold">Variants</h2>
					<p className="text-sm text-muted-foreground">
						Review the current options here and open a focused modal when you need to create or edit one.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-sm text-muted-foreground">{group.variants.length} variants</div>
					<Dialog>
						<DialogTrigger asChild>
							<Button size="sm">
								<Plus className="h-4 w-4" />
								Add variant
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>Add variant</DialogTitle>
								<DialogDescription>
									Create a new variant that inherits the product details and optionally uses a custom price.
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
								<FormSection
									title="Variant details"
									description="Define the label, sorting order and stock for this option."
								>
									<VariantFields />
									<Field label="Stock" name="stock" hint="Use a whole number such as 25.">
										<Input id="stock" name="stock" defaultValue={group.stock} inputMode="numeric" />
									</Field>
								</FormSection>
								<FormSection
									title="Pricing"
									description="Keep the group price or set a custom amount for this specific variant."
								>
									<VariantPriceFields basePrice={groupBasePrice} currency={groupCurrency} />
								</FormSection>
								<ActiveCheckbox defaultChecked />
								<DialogFooter>
									<Button type="submit">
										<Plus className="h-4 w-4" />
										Add variant
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
							? formatMoney({ amount: variant.priceAmount, currency: variant.currency })
							: "No price";

					return (
						<Card key={variant.id}>
							<CardHeader>
								<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
									<div className="space-y-2">
										<CardTitle>{variant.variantLabel || group.name}</CardTitle>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant={variant.active ? "secondary" : "outline"}>
												{variant.active ? "Active" : "Inactive"}
											</Badge>
											<Badge variant="outline">{usesCustomPrice ? "Custom price" : "Uses group price"}</Badge>
										</div>
									</div>
									<div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
										<div>
											<div className="text-xs uppercase tracking-wide">Price</div>
											<div className="font-medium text-foreground">{priceLabel}</div>
										</div>
										<div>
											<div className="text-xs uppercase tracking-wide">Stock</div>
											<div className="font-medium text-foreground">{variant.stock || "Not set"}</div>
										</div>
										<div>
											<div className="text-xs uppercase tracking-wide">Sort order</div>
											<div className="font-medium text-foreground">{variant.variantOrder || "Auto"}</div>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
								<div className="space-y-1 text-sm text-muted-foreground">
									<div className="font-mono text-xs">{variant.priceId ?? "No active price id"}</div>
									<div>{variant.description || "Uses the product description shared by the group."}</div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Dialog>
										<DialogTrigger asChild>
											<Button variant="outline" size="sm">
												<Pencil className="h-4 w-4" />
												Edit
											</Button>
										</DialogTrigger>
										<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
											<DialogHeader>
												<DialogTitle>Edit variant</DialogTitle>
												<DialogDescription>
													Update stock, status, order and pricing for this variant without leaving the product
													page.
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
												<FormSection
													title="Variant details"
													description="Adjust the customer-facing option label and internal ordering."
												>
													<div className="grid gap-4 md:grid-cols-2">
														<Field
															label="Stock"
															name={`stock-${variant.id}`}
															hint="Use a whole number such as 25."
														>
															<Input
																id={`stock-${variant.id}`}
																name="stock"
																defaultValue={variant.stock}
																inputMode="numeric"
															/>
														</Field>
													</div>
													<VariantFields variant={variant.variantLabel} variantOrder={variant.variantOrder} />
												</FormSection>
												<FormSection
													title="Pricing"
													description="Keep the group price or override it only for this variant."
												>
													<VariantPriceFields
														basePrice={groupBasePrice}
														currency={groupCurrency || variant.currency}
														overridePrice={usesCustomPrice ? variant.priceDecimal : null}
													/>
												</FormSection>
												<ActiveCheckbox defaultChecked={variant.active} />
												<DialogFooter>
													<SubmitButton>Save variant</SubmitButton>
												</DialogFooter>
											</form>
										</DialogContent>
									</Dialog>
									<form action={archiveStripeVariantAction}>
										<input type="hidden" name="productId" value={variant.id} />
										<input type="hidden" name="currentSlug" value={group.slug} />
										<Button type="submit" variant="outline" size="sm">
											<Archive className="h-4 w-4" />
											Archive
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
