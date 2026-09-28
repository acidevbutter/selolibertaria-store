import { PackagePlus, Tags } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DataTable } from "@/app/admin/_components/ui/DataTable";
import { StatusBadge } from "@/app/admin/_components/ui/StatusBadge";
import { AdminProductImagePreview } from "@/app/admin/products/_components/admin-product-image-preview";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { listAdminProductGroups } from "@/lib/admin-products";
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

type ProductGroup = Awaited<ReturnType<typeof listAdminProductGroups>>[number];
type ProductGroupRow = ProductGroup & { id: string };

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
	let groups: Awaited<ReturnType<typeof listAdminProductGroups>> = [];
	let error: string | null = null;

	try {
		groups = await listAdminProductGroups();
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

	function priceLabelFor(group: ProductGroup) {
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
		if (!firstPrice || !lastPrice) return "Sem preço";
		return firstPrice.amount === lastPrice.amount
			? formatMoney({ ...firstPrice, locale: displayLocale })
			: `${formatMoney({ ...firstPrice, locale: displayLocale })} - ${formatMoney({ ...lastPrice, locale: displayLocale })}`;
	}

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Produtos"
				title="Catálogo de livros"
				description="Gerencie livros da loja, variantes, preços e disponibilidade."
				actions={
					<>
						<form className="min-w-[280px] max-w-md flex-1">
							<input
								name="q"
								defaultValue={query}
								placeholder="Buscar produtos, slugs ou categorias"
								aria-label="Buscar produtos, slugs ou categorias"
								className="h-[var(--sl-h-button)] w-full border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-4 text-sm text-[var(--sl-ink)] outline-none placeholder:text-[color:var(--sl-text-disabled)]"
								style={{ borderRadius: "var(--sl-radius)" }}
							/>
						</form>
						{hasCapability(session.user.role, "settings.write") ? (
							<Link className="ad-btn ad-sec" href="/admin/products/categories">
								<Tags className="h-4 w-4" />
								Categorias
							</Link>
						) : null}
						<Link className="ad-btn ad-pri" href="/admin/products/new">
							<PackagePlus className="h-4 w-4" />
							Novo livro
						</Link>
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
					<h2 className="editorial-serif text-xl font-semibold text-[var(--sl-ink)]">
						Catálogo indisponível
					</h2>
					<p className="mt-2 text-sm text-[var(--sl-text-muted)]">{error}</p>
				</EditorialPanel>
			) : (
				<EditorialPanel className="p-0">
					<div className="border-b border-[var(--sl-line)] px-6 py-5 sm:px-8">
						<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
							Produtos
						</div>
					</div>
					<div className="p-6 sm:p-8">
						<div className="space-y-3 md:hidden">
							{filtered.map((group) => (
								<div
									key={group.slug}
									className="space-y-3 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-4"
								>
									<div className="flex min-w-0 items-center gap-3">
										<AdminProductImagePreview images={group.images} alt={group.name} size="sm" />
										<div className="min-w-0">
											<div className="truncate font-medium">{group.name}</div>
											<div className="truncate font-mono text-xs text-[var(--sl-text-muted)]">
												{group.slug}
											</div>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div>
											<span className="block text-xs text-[var(--sl-text-muted)]">Categoria</span>
											{group.category || "Não informada"}
										</div>
										<div>
											<span className="block text-xs text-[var(--sl-text-muted)]">Preço</span>
											{priceLabelFor(group)}
										</div>
										<div>
											<span className="block text-xs text-[var(--sl-text-muted)]">Variantes</span>
											{group.variants.length}
										</div>
										<div>
											<span className="block text-xs text-[var(--sl-text-muted)]">Status</span>
											<StatusBadge tone={group.active ? "active" : "neutral"}>
												{group.active ? "Ativo" : "Inativo"}
											</StatusBadge>
										</div>
									</div>
									<Link
										className="inline-block text-sm font-semibold text-[var(--sl-accent)] underline underline-offset-4"
										href={`/admin/products/${group.slug}`}
									>
										Editar produto
									</Link>
								</div>
							))}
							{filtered.length === 0 ? (
								<div className="py-6 text-sm text-[var(--sl-text-muted)]">Nenhum livro encontrado.</div>
							) : null}
						</div>
						<div className="hidden md:block">
							<DataTable<ProductGroupRow>
								columns={[
									{
										key: "name",
										label: "Produto",
										render: (group) => (
											<div className="flex items-center gap-3">
												<AdminProductImagePreview images={group.images} alt={group.name} size="sm" />
												<div className="min-w-0">
													<div className="font-medium">{group.name}</div>
													<div className="font-mono text-xs text-[var(--sl-text-muted)]">{group.slug}</div>
												</div>
											</div>
										),
									},
									{
										key: "category",
										label: "Categoria",
										render: (group) => group.category || "Categoria não informada",
									},
									{ key: "variants", label: "Variantes", render: (group) => group.variants.length },
									{ key: "price", label: "Preço", numeric: true, render: priceLabelFor },
									{
										key: "status",
										label: "Status",
										render: (group) => (
											<StatusBadge tone={group.active ? "active" : "neutral"}>
												{group.active ? "Ativo" : "Inativo"}
											</StatusBadge>
										),
									},
									{
										key: "actions",
										label: "",
										render: (group) => (
											<Link
												className="text-sm font-semibold text-[var(--sl-accent)] underline underline-offset-4"
												href={`/admin/products/${group.slug}`}
											>
												Editar produto
											</Link>
										),
									},
								]}
								rows={filtered.map((group) => ({ ...group, id: group.slug }))}
								empty={
									<div className="flex flex-wrap items-center justify-between gap-3">
										<span>Nenhum livro encontrado.</span>
										<Link className="ad-btn ad-sec" href="/admin/products/new">
											Cadastrar novo livro
										</Link>
									</div>
								}
							/>
						</div>
					</div>
				</EditorialPanel>
			)}
		</AdminEditorialPage>
	);
}
