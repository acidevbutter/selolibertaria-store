import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSystemCategoryAction, renameStripeCategoryAction } from "@/app/admin/products/actions";
import { listAdminStripeCategories } from "@/lib/admin-stripe-products";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { listSystemCategories } from "@/lib/product-categories";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
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
		error = err instanceof Error ? err.message : "Could not load categories.";
	}

	const stripeStatsBySlug = new Map(stripeCategories.map((category) => [category.slug, category]));

	return (
		<main className="mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
			<div className="space-y-3">
				<Link
					href="/admin/products"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Products
				</Link>
				<div>
					<h1 className="text-2xl font-semibold">Categories</h1>
					<p className="text-sm text-muted-foreground">
						Categories are stored in Stripe product metadata and reflected in storefront navigation.
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>System categories</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={createSystemCategoryAction} className="mb-6 flex max-w-md gap-2">
						<Input name="name" placeholder="New category name" required />
						<Button type="submit">Add</Button>
					</form>
					{error ? (
						<p className="text-sm text-muted-foreground">{error}</p>
					) : (
						<Table className="min-w-[680px]">
							<TableHeader>
								<TableRow>
									<TableHead>Current name</TableHead>
									<TableHead>Slug</TableHead>
									<TableHead>Source</TableHead>
									<TableHead>Products</TableHead>
									<TableHead>Variants</TableHead>
									<TableHead>Rename</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{categories.map((category) => (
									<TableRow key={category.slug}>
										<TableCell className="font-medium">{category.name}</TableCell>
										<TableCell className="font-mono text-xs">{category.slug}</TableCell>
										<TableCell>{category.source}</TableCell>
										<TableCell>{stripeStatsBySlug.get(category.slug)?.products ?? 0}</TableCell>
										<TableCell>{stripeStatsBySlug.get(category.slug)?.variants ?? 0}</TableCell>
										<TableCell>
											<form action={renameStripeCategoryAction} className="flex min-w-[260px] gap-2">
												<input type="hidden" name="oldCategory" value={category.name} />
												<Input
													name="newCategory"
													defaultValue={category.name}
													aria-label={`Rename ${category.name}`}
													required
												/>
												<Button type="submit" variant="outline" size="sm">
													Save
												</Button>
											</form>
										</TableCell>
									</TableRow>
								))}
								{categories.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="py-6 text-muted-foreground">
											No categories found in the system.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
							<TableCaption>
								Stripe categories are synced into Mongo automatically; duplicate names are ignored.
							</TableCaption>
						</Table>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
