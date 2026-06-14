import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
	ActiveCheckbox,
	FormSection,
	PriceFields,
	ProductCoreFields,
	SubmitButton,
	VariantFields,
} from "@/app/admin/products/_components/product-form-fields";
import { createStripeProductAction } from "@/app/admin/products/actions";
import { listAdminStripeProductGroups } from "@/lib/admin-stripe-products";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { listSystemCategories } from "@/lib/product-categories";
import { EditorialEyebrow, EditorialPanel } from "@/ui/editorial/editorial-primitives";
import { CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";

export const dynamic = "force-dynamic";

export default async function NewAdminProductPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "catalog.write")) redirect("/forbidden");
	const [categories, groups] = await Promise.all([listSystemCategories(), listAdminStripeProductGroups()]);
	const orderOptions = Array.from({ length: groups.length + 1 }, (_, index) => index + 1);

	return (
		<main className="mx-auto max-w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<div className="space-y-3">
				<Link
					href="/admin/products"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Products
				</Link>
				<div>
					<EditorialEyebrow>Product editor</EditorialEyebrow>
					<h1 className="editorial-serif text-3xl font-semibold">New product</h1>
					<p className="max-w-2xl text-sm leading-7 text-[color:var(--editorial-muted)]">
						Create a product group, define its first variant and publish it with clearer availability
						controls.
					</p>
				</div>
			</div>

			<EditorialPanel>
				<CardHeader>
					<CardTitle>Create product</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={createStripeProductAction} className="space-y-6">
						<FormSection
							title="Product details"
							description="Set the shared information that all variants will inherit from this product."
						>
							<ProductCoreFields categories={categories} orderOptions={orderOptions} />
						</FormSection>
						<FormSection
							title="First variant"
							description="Create the first option now so the product is ready for the catalog."
						>
							<VariantFields />
						</FormSection>
						<FormSection
							title="Pricing"
							description="Define the initial price and currency for the first variant."
						>
							<PriceFields currency="usd" />
						</FormSection>
						<ActiveCheckbox defaultChecked />
						<SubmitButton>Create product</SubmitButton>
					</form>
				</CardContent>
			</EditorialPanel>
		</main>
	);
}
