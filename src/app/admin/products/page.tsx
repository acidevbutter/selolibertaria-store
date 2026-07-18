import { PackagePlus, Tags } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminProductImagePreview } from "@/app/admin/products/_components/admin-product-image-preview";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { listAdminStripeProductGroups } from "@/lib/admin-stripe-products";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/shadcn/table";

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
	const displayLocale = (await getDefaultLocaleSetting()) ?? DEFAULT_LOCALE;
	let groups: Awaited<ReturnType<typeof listAdminStripeProductGroups>> = [];
	let error: string | null = null;

	try {
		groups = await listAdminStripeProductGroups();
	} catch (err) {
		error = "Não foi possível carregar o catálogo no momento.";
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
				eyebrow="Produtos"
				title="Catálogo"
				description="Gerencie produtos, variantes e preços."
				actions={
					<>
						<form className="min-w-[280px] max-w-md flex-1">
							<Input
								name="q"
								defaultValue={query}
								placeholder="Buscar produtos, slugs ou categorias"
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
								Novo produto
							</Link>
						</Button>
					</>
				}
			/>
			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat label="Produtos" value={filtered.length} helper="Resultados do filtro atual." />
				<AdminEditorialStat label="Ativos" value={activeCount} helper="Disponíveis para venda." />
				<AdminEditorialStat
					label="Variantes"
					value={variantCount}
					helper="Somadas entre os produtos listados."
				/>
			</div>

			{error ? (
				<EditorialPanel>
					<CardHeader>
						<CardTitle>Catálogo indisponível</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">{error}</CardContent>
				</EditorialPanel>
			) : (
				<EditorialPanel className="overflow-hidden p-0">
					<CardHeader>
						<CardTitle>Produtos</CardTitle>
					</CardHeader>
					<CardContent>
						<Table className="min-w-[760px]">
							<TableHeader>
								<TableRow>
									<TableHead>Produto</TableHead>
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
												? formatMoney({ ...firstPrice, locale: displayLocale })
												: `${formatMoney({ ...firstPrice, locale: displayLocale })} - ${formatMoney({ ...lastPrice, locale: displayLocale })}`
											: "Sem preço";

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
											<TableCell>{group.category || "Categoria não informada"}</TableCell>
											<TableCell>{group.variants.length}</TableCell>
											<TableCell>{priceLabel}</TableCell>
											<TableCell>
												<Badge variant={group.active ? "secondary" : "outline"}>
													{group.active ? "Ativo" : "Inativo"}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<Link
													className="text-sm font-semibold text-[color:var(--editorial-accent)] underline underline-offset-4"
													href={`/admin/products/${group.slug}`}
												>
													Editar produto
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
						</Table>
					</CardContent>
				</EditorialPanel>
			)}
		</AdminEditorialPage>
	);
}
