import { PackagePlus, Tags } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminProductImagePreview } from "@/app/admin/products/_components/admin-product-image-preview";
import { listAdminStripeProductGroups } from "@/lib/admin-stripe-products";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { formatMoney } from "@/lib/utils";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { Badge } from "@/ui/shadcn/badge";
import { Button } from "@/ui/shadcn/button";
import { CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/shadcn/table";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string | string[] };

const asString = (value: unknown) =>
	typeof value === "string" ? value : Array.isArray(value) && typeof value[0] === "string" ? value[0] : "";

export default async function AdminProductsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "catalog.write")) redirect("/forbidden");

	const sp = (await searchParams) || {};
	const query = asString(sp.q).toLowerCase();
	let groups: Awaited<ReturnType<typeof listAdminStripeProductGroups>> = [];
	let error: string | null = null;

	try {
		groups = await listAdminStripeProductGroups();
	} catch (err) {
		error = err instanceof Error ? err.message : "Could not load Stripe products.";
	}

	const filtered = query
		? groups.filter((group) =>
				[group.name, group.slug, group.category].join(" ").toLowerCase().includes(query),
			)
		: groups;
	const activeCount = filtered.filter((group) => group.active).length;
	const variantCount = filtered.reduce((total, group) => total + group.variants.length, 0);

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Livros"
				title="Catálogo, variantes e preços no mesmo enquadramento editorial do admin."
				description="A listagem de produtos passa a conversar com o layout do Figma: hero introdutório, CTAs retas, filtros limpos e tabela de catálogo mais sóbria."
				actions={
					<>
						<form className="min-w-[280px] max-w-md flex-1">
							<Input
								name="q"
								defaultValue={query}
								placeholder="Buscar livros, slugs ou categorias"
								className="rounded-none border-[color:var(--editorial-border)] bg-[#fbf7f1]"
							/>
						</form>
						{hasCapability(session.user.role, "settings.write") ? (
							<Button asChild variant="outline" className="rounded-none">
								<Link href="/admin/products/categories">
									<Tags className="h-4 w-4" />
									Categorias
								</Link>
							</Button>
						) : null}
						<Button
							asChild
							className="rounded-none bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]"
						>
							<Link href="/admin/products/new">
								<PackagePlus className="h-4 w-4" />
								Novo livro
							</Link>
						</Button>
					</>
				}
			/>
			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Grupos"
					value={filtered.length}
					helper="Produtos agrupados por metadata.slug."
				/>
				<AdminEditorialStat
					label="Ativos"
					value={activeCount}
					helper="Itens disponíveis para venda neste recorte."
				/>
				<AdminEditorialStat
					label="Variantes"
					value={variantCount}
					helper="Soma de todas as edições e formatos listados."
				/>
			</div>

			{error ? (
				<EditorialPanel>
					<CardHeader>
						<CardTitle>Catálogo Stripe indisponível</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">{error}</CardContent>
				</EditorialPanel>
			) : (
				<EditorialPanel className="overflow-hidden p-0">
					<CardHeader>
						<CardTitle>Stripe catalog</CardTitle>
					</CardHeader>
					<CardContent>
						<Table className="min-w-[760px]">
							<TableHeader>
								<TableRow>
									<TableHead>Livro</TableHead>
									<TableHead>Categoria</TableHead>
									<TableHead>Variantes</TableHead>
									<TableHead>Preço</TableHead>
									<TableHead>Status</TableHead>
									<TableHead></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtered.map((group) => {
									const prices = group.variants
										.map((variant) =>
											typeof variant.priceAmount === "number"
												? { amount: variant.priceAmount, currency: variant.currency }
												: null,
										)
										.filter((price): price is { amount: number; currency: string } => Boolean(price))
										.sort((a, b) => a.amount - b.amount);
									const firstPrice = prices[0];
									const lastPrice = prices[prices.length - 1];
									const priceLabel =
										firstPrice && lastPrice
											? firstPrice.amount === lastPrice.amount
												? formatMoney(firstPrice)
												: `${formatMoney(firstPrice)} - ${formatMoney(lastPrice)}`
											: "No price";

									return (
										<TableRow key={group.slug}>
											<TableCell>
												<div className="flex items-center gap-3">
													<AdminProductImagePreview images={group.images} alt={group.name} size="sm" />
													<div className="min-w-0">
														<div className="font-medium">{group.name}</div>
														<div className="font-mono text-xs text-muted-foreground">{group.slug}</div>
													</div>
												</div>
											</TableCell>
											<TableCell>{group.category || "—"}</TableCell>
											<TableCell>{group.variants.length}</TableCell>
											<TableCell>{priceLabel}</TableCell>
											<TableCell>
												<Badge variant={group.active ? "secondary" : "outline"}>
													{group.active ? "Active" : "Inactive"}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<Link
													className="text-sm font-semibold text-[color:var(--editorial-accent)] underline underline-offset-4"
													href={`/admin/products/${group.slug}`}
												>
													Editar
												</Link>
											</TableCell>
										</TableRow>
									);
								})}
								{filtered.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="py-6 text-muted-foreground">
											Nenhum produto encontrado.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
							<TableCaption>Produtos agrupados por `metadata.slug` na Stripe.</TableCaption>
						</Table>
					</CardContent>
				</EditorialPanel>
			)}
		</AdminEditorialPage>
	);
}
