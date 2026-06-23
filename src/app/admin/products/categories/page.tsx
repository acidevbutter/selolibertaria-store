import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSystemCategoryAction, renameStripeCategoryAction } from "@/app/admin/products/actions";
import { listAdminStripeCategories } from "@/lib/admin-stripe-products";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { listSystemCategories } from "@/lib/product-categories";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { Button } from "@/ui/shadcn/button";
import { CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/shadcn/table";

export const dynamic = "force-dynamic";

function getCategorySourceLabel(source: string) {
	return source === "stripe" ? "Catálogo integrado" : "Criada no admin";
}

export default async function AdminProductCategoriesPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "settings.write")) redirect("/forbidden");

	let categories: Awaited<ReturnType<typeof listSystemCategories>> = [];
	let stripeCategories: Awaited<ReturnType<typeof listAdminStripeCategories>> = [];
	let error: string | null = null;

	try {
		[categories, stripeCategories] = await Promise.all([listSystemCategories(), listAdminStripeCategories()]);
	} catch (err) {
		categories = await listSystemCategories({ syncStripe: false });
		error = "Não foi possível carregar todas as categorias agora. A lista local continua disponível.";
	}

	const stripeStatsBySlug = new Map(stripeCategories.map((category) => [category.slug, category]));
	const syncedCategories = categories.filter((category) => category.source === "stripe").length;
	const variantCoverage = stripeCategories.reduce((total, category) => total + category.variants, 0);

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
							className="inline-flex items-center gap-2 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar para livros
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
				<CardHeader className="px-0 pt-0">
					<CardTitle>Cadastrar nova categoria</CardTitle>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<form
						action={createSystemCategoryAction}
						className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end"
					>
						<Input
							name="name"
							placeholder="Nome da nova categoria"
							required
							className="max-w-md rounded-none border-[color:var(--editorial-border)] bg-white"
						/>
						<Button type="submit" className="rounded-none">
							Adicionar categoria
						</Button>
					</form>
				</CardContent>
			</EditorialPanel>

			<EditorialPanel className="overflow-hidden p-0">
				<CardHeader>
					<CardTitle>Categorias do sistema</CardTitle>
				</CardHeader>
				<CardContent>
					{error ? (
						<p className="text-sm text-muted-foreground">{error}</p>
					) : (
						<Table className="min-w-[760px]">
							<TableHeader>
								<TableRow>
									<TableHead>Nome atual</TableHead>
									<TableHead>Slug</TableHead>
									<TableHead>Origem</TableHead>
									<TableHead>Livros</TableHead>
									<TableHead>Variantes</TableHead>
									<TableHead>Renomear</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{categories.map((category) => (
									<TableRow key={category.slug}>
										<TableCell className="font-medium">{category.name}</TableCell>
										<TableCell className="font-mono text-xs">{category.slug}</TableCell>
										<TableCell>{getCategorySourceLabel(category.source)}</TableCell>
										<TableCell>{stripeStatsBySlug.get(category.slug)?.products ?? 0}</TableCell>
										<TableCell>{stripeStatsBySlug.get(category.slug)?.variants ?? 0}</TableCell>
										<TableCell>
											<form
												action={renameStripeCategoryAction}
												className="flex min-w-[260px] max-w-md flex-col gap-2 sm:flex-row sm:items-end"
											>
												<input type="hidden" name="oldCategory" value={category.name} />
												<Input
													name="newCategory"
													defaultValue={category.name}
													aria-label={`Renomear ${category.name}`}
													className="max-w-sm rounded-none border-[color:var(--editorial-border)] bg-white"
													required
												/>
												<Button type="submit" variant="outline" size="sm" className="rounded-none">
													Salvar nome
												</Button>
											</form>
										</TableCell>
									</TableRow>
								))}
								{categories.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="py-6 text-muted-foreground">
											Nenhuma categoria disponível neste momento.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
