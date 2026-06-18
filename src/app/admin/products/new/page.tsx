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
					Livros
				</Link>
				<div>
					<EditorialEyebrow>Livro</EditorialEyebrow>
					<h1 className="editorial-serif text-3xl font-semibold">Novo livro</h1>
				</div>
			</div>

			<EditorialPanel>
				<CardHeader>
					<CardTitle>Cadastro</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={createStripeProductAction} className="space-y-6">
						<FormSection title="Informações principais">
							<ProductCoreFields categories={categories} orderOptions={orderOptions} autoFormatSlug />
						</FormSection>
						<FormSection title="Primeira variante">
							<VariantFields />
						</FormSection>
						<FormSection title="Preço">
							<PriceFields currency="usd" />
						</FormSection>
						<ActiveCheckbox defaultChecked />
						<SubmitButton>Criar livro</SubmitButton>
					</form>
				</CardContent>
			</EditorialPanel>
		</main>
	);
}
