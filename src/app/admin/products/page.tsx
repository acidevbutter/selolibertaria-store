import { PackagePlus, Tags } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminProductImagePreview } from "@/app/admin/products/_components/admin-product-image-preview";
import { listAdminStripeProductGroups } from "@/lib/admin-stripe-products";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { formatMoney } from "@/lib/utils";
import { EditorialEyebrow, EditorialPanel } from "@/ui/editorial/editorial-primitives";
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

	return (
		<main className="mx-auto max-w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<EditorialEyebrow>Admin editorial v2</EditorialEyebrow>
					<h1 className="editorial-serif text-3xl font-semibold">Products</h1>
					<p className="max-w-2xl text-sm leading-7 text-[color:var(--editorial-muted)]">
						Manage Stripe products, prices, variants, categories, and storefront metadata.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{hasCapability(session.user.role, "settings.write") ? (
						<Button asChild variant="outline">
							<Link href="/admin/products/categories">
								<Tags className="h-4 w-4" />
								Categories
							</Link>
						</Button>
					) : null}
					<Button asChild>
						<Link href="/admin/products/new">
							<PackagePlus className="h-4 w-4" />
							New product
						</Link>
					</Button>
				</div>
			</div>

			<form className="max-w-md">
				<Input name="q" defaultValue={query} placeholder="Search products, slugs, or categories" />
			</form>

			{error ? (
				<EditorialPanel>
					<CardHeader>
						<CardTitle>Stripe catalog unavailable</CardTitle>
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
									<TableHead>Product</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Variants</TableHead>
									<TableHead>Price</TableHead>
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
												<Link className="text-sm underline" href={`/admin/products/${group.slug}`}>
													Edit
												</Link>
											</TableCell>
										</TableRow>
									);
								})}
								{filtered.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="py-6 text-muted-foreground">
											No products found.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
							<TableCaption>Products are grouped by Stripe metadata.slug.</TableCaption>
						</Table>
					</CardContent>
				</EditorialPanel>
			)}
		</main>
	);
}
