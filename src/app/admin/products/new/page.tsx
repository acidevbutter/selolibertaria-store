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
import { createProductAction } from "@/app/admin/products/actions";
import { listAdminProductGroups } from "@/lib/admin-products";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { listSystemCategories } from "@/lib/product-categories";
import {
	AdminEditorialHero,
	AdminEditorialNote,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";

export const dynamic = "force-dynamic";

export default async function NewAdminProductPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "catalog.write")) redirect("/forbidden");
	const [categories, groups] = await Promise.all([listSystemCategories(), listAdminProductGroups()]);
	const orderOptions = Array.from({ length: groups.length + 1 }, (_, index) => index + 1);

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Catálogo"
				title="Novo livro"
				description="Cadastre os dados comerciais do livro, defina a primeira variante e publique o item sem perder o contexto do catálogo."
				actions={
					<Link
						href="/admin/products"
						className="inline-flex items-center gap-2 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
					>
						<ArrowLeft className="h-4 w-4" />
						Voltar para livros
					</Link>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Categorias"
					value={categories.length}
					helper="Opções disponíveis para classificar o produto."
				/>
				<AdminEditorialStat
					label="Posição inicial"
					value={orderOptions[0] ?? 1}
					helper="Ordem sugerida no catálogo atual."
				/>
				<AdminEditorialNote
					title="Como usar"
					description="Preencha os dados principais do livro, revise a primeira variante e salve para abrir a gestão completa do item."
				/>
			</div>

			<EditorialPanel>
				<CardHeader>
					<CardTitle>Cadastro do livro</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={createProductAction} className="space-y-6">
						<FormSection title="Informações principais do livro">
							<ProductCoreFields categories={categories} orderOptions={orderOptions} autoFormatSlug />
						</FormSection>
						<FormSection title="Primeira variante">
							<VariantFields />
						</FormSection>
						<FormSection title="Preço">
							<PriceFields />
						</FormSection>
						<ActiveCheckbox defaultChecked />
						<SubmitButton>Criar livro</SubmitButton>
					</form>
				</CardContent>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
