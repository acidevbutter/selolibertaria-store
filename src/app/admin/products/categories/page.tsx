import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DataTable } from "@/app/admin/_components/ui/DataTable";
import { createSystemCategoryAction, renameProductCategoryAction } from "@/app/admin/products/actions";
import { listAdminProductCategories } from "@/lib/admin-products";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { listSystemCategories } from "@/lib/product-categories";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { SlButton } from "@/ui/sl/sl-button";

const inputClassName =
	"h-[var(--sl-h-button)] w-full border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-4 text-sm text-[var(--sl-ink)] outline-none placeholder:text-[color:var(--sl-text-disabled)]";
const inputStyle = { borderRadius: "var(--sl-radius)" } as const;

export const dynamic = "force-dynamic";

function getCategorySourceLabel(source: string) {
	return source === "catalog" ? "Catálogo integrado" : "Criada no admin";
}

export default async function AdminProductCategoriesPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "settings.write")) redirect("/forbidden");

	let categories: Awaited<ReturnType<typeof listSystemCategories>> = [];
	let catalogCategories: Awaited<ReturnType<typeof listAdminProductCategories>> = [];
	let error: string | null = null;

	try {
		[categories, catalogCategories] = await Promise.all([
			listSystemCategories(),
			listAdminProductCategories(),
		]);
	} catch (err) {
		categories = await listSystemCategories({ syncCatalog: false });
		error = "Não foi possível carregar todas as categorias agora. A lista local continua disponível.";
	}

	const catalogStatsBySlug = new Map(catalogCategories.map((category) => [category.slug, category]));
	const syncedCategories = categories.filter((category) => category.source === "catalog").length;
	const variantCoverage = catalogCategories.reduce((total, category) => total + category.variants, 0);

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Categorias"
				title="Mapa de categorias"
				description="Renomeie, consolide e acompanhe as categorias que alimentam o catálogo e a navegação editorial."
				actions={
					<div className="flex flex-wrap gap-3">
						<Link
							href="/admin/products"
							className="inline-flex items-center gap-2 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-4 py-3 text-sm text-[var(--sl-text-muted)] transition-colors hover:text-[var(--sl-ink)]"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar para produtos
						</Link>
					</div>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Categorias"
					value={categories.length}
					helper="Registros ativos no sistema."
				/>
				<AdminEditorialStat
					label="Sincronizadas"
					value={syncedCategories}
					helper="Vindas do catálogo atual."
				/>
				<AdminEditorialStat
					label="Variantes"
					value={variantCoverage}
					helper="Itens cobertos por categoria."
				/>
			</div>

			<EditorialPanel className="space-y-6">
				<h2 className="editorial-serif text-xl font-semibold text-[var(--sl-ink)]">
					Cadastrar nova categoria
				</h2>
				<form
					action={createSystemCategoryAction}
					className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end"
				>
					<input
						name="name"
						placeholder="Nome da nova categoria"
						required
						className={`max-w-md ${inputClassName}`}
						style={inputStyle}
					/>
					<SlButton type="submit" variant="primary">
						Adicionar categoria
					</SlButton>
				</form>
			</EditorialPanel>

			<EditorialPanel className="overflow-hidden p-0">
				<div className="border-b border-[var(--sl-line)] px-6 py-5 sm:px-8">
					<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
						Categorias do sistema
					</div>
				</div>
				<div className="p-6 sm:p-8">
					{error ? (
						<p className="text-sm text-[var(--sl-text-muted)]">{error}</p>
					) : (
						<DataTable
							columns={[
								{
									key: "name",
									label: "Nome atual",
									render: (c) => <span className="font-medium">{c.name}</span>,
								},
								{
									key: "slug",
									label: "Slug",
									render: (c) => <span className="font-mono text-xs">{c.slug}</span>,
								},
								{ key: "source", label: "Origem", render: (c) => getCategorySourceLabel(c.source) },
								{
									key: "products",
									label: "Produtos",
									render: (c) => catalogStatsBySlug.get(c.slug)?.products ?? 0,
								},
								{
									key: "variants",
									label: "Variantes",
									render: (c) => catalogStatsBySlug.get(c.slug)?.variants ?? 0,
								},
								{
									key: "rename",
									label: "Renomear",
									render: (category) => (
										<form
											action={renameProductCategoryAction}
											className="flex min-w-[260px] max-w-md flex-col gap-2 sm:flex-row sm:items-end"
										>
											<input type="hidden" name="oldCategory" value={category.name} />
											<input
												name="newCategory"
												defaultValue={category.name}
												aria-label={`Renomear ${category.name}`}
												className={`max-w-sm ${inputClassName}`}
												style={inputStyle}
												required
											/>
											<SlButton type="submit" variant="secondary" size="sm">
												Salvar nome
											</SlButton>
										</form>
									),
								},
							]}
							rows={categories.map((category) => ({ ...category, id: category.slug }))}
							empty="Nenhuma categoria disponível neste momento."
						/>
					)}
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
