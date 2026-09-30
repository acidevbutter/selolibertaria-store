import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MetricCard } from "@/app/admin/_components/ui/MetricCard";
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

export const dynamic = "force-dynamic";

export default async function NewAdminProductPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "catalog.write")) redirect("/forbidden");
	const [categories, groups] = await Promise.all([listSystemCategories(), listAdminProductGroups()]);
	const orderOptions = Array.from({ length: groups.length + 1 }, (_, index) => index + 1);

	return (
		<>
			<div className="ad-head">
				<h1>Novo livro</h1>
				<span className="ad-meta">
					Cadastre os dados comerciais do livro, defina a primeira variante e publique o item sem perder o
					contexto do catálogo.
				</span>
				<div className="ad-acts">
					<Link className="ad-btn ad-sec" href="/admin/products">
						<ArrowLeft className="h-4 w-4" />
						Voltar para livros
					</Link>
				</div>
			</div>

			<div className="grid gap-5 lg:grid-cols-3">
				<MetricCard
					label="Categorias"
					value={categories.length}
					note="Opções disponíveis para classificar o produto."
				/>
				<MetricCard
					label="Posição inicial"
					value={orderOptions[0] ?? 1}
					note="Ordem sugerida no catálogo atual."
				/>
				<div className="border border-[var(--ad-line)] bg-[var(--ad-sheet)] p-5">
					<div className="ad-ml">Como usar</div>
					<p className="ad-body mt-3">
						Preencha os dados principais do livro, revise a primeira variante e salve para abrir a gestão
						completa do item.
					</p>
				</div>
			</div>

			<div className="ad-panel">
				<div style={{ padding: 24 }}>
					<h2 className="ad-eb">Cadastro do livro</h2>
					<form action={createProductAction} className="mt-6 space-y-6">
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
				</div>
			</div>
		</>
	);
}
