import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminVariantsPanel } from "@/app/admin/products/_components/admin-variants-panel.client";
import {
	ActiveCheckbox,
	FormSection,
	ProductCoreFields,
	SubmitButton,
} from "@/app/admin/products/_components/product-form-fields";
import {
	archiveStripeVariantAction,
	createStripeVariantAction,
	updateStripeProductGroupAction,
	updateStripeVariantAction,
} from "@/app/admin/products/actions";
import { getAdminStripeProductGroup, listAdminStripeProductGroups } from "@/lib/admin-stripe-products";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { listProductAuditEntries } from "@/lib/product-audit";
import { listSystemCategories } from "@/lib/product-categories";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { Badge } from "@/ui/shadcn/badge";
import { CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";

export const dynamic = "force-dynamic";

export default async function AdminProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "catalog.write")) redirect("/forbidden");

	const { slug: rawSlug } = await params;
	const slug = decodeURIComponent(rawSlug);
	const [group, categories, groups] = await Promise.all([
		getAdminStripeProductGroup(slug),
		listSystemCategories(),
		listAdminStripeProductGroups(),
	]);
	if (!group) redirect("/admin/products");
	const history = await listProductAuditEntries(group.slug, 15);
	const currentOrder = Number.parseInt(group.order || "", 10);
	const orderCount = Number.isFinite(currentOrder) ? groups.length : groups.length + 1;
	const orderOptions = Array.from({ length: orderCount }, (_, index) => index + 1);
	const activeVariants = group.variants.filter((variant) => variant.active).length;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Livro"
				title={group.name}
				description="Edite os dados compartilhados do livro, acompanhe variantes e consulte o histórico operacional sem sair do contexto do catálogo."
				actions={
					<div className="flex flex-wrap items-center gap-3">
						<Link
							href="/admin/products"
							className="inline-flex items-center gap-2 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar para livros
						</Link>
						<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3">
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
								Slug
							</div>
							<div className="mt-2 font-mono text-xs text-[color:var(--editorial-muted)]">{group.slug}</div>
						</div>
						<Badge variant={group.active ? "secondary" : "outline"}>
							{group.active ? "Ativo" : "Inativo"}
						</Badge>
					</div>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Variantes"
					value={group.variants.length}
					helper="Itens cadastrados neste livro."
				/>
				<AdminEditorialStat
					label="Ativas"
					value={activeVariants}
					helper="Variantes disponíveis no catálogo."
				/>
				<AdminEditorialStat
					label="Categoria"
					value={group.category || "—"}
					helper="Classificação principal do livro."
				/>
			</div>

			<EditorialPanel>
				<CardHeader>
					<CardTitle>Dados do livro</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={updateStripeProductGroupAction} className="space-y-6">
						<input type="hidden" name="currentSlug" value={group.slug} />
						<FormSection title="Informações principais">
							<ProductCoreFields
								name={group.name}
								slug={group.slug}
								category={group.category}
								description={group.description}
								images={group.images}
								stock={group.stock}
								order={group.order}
								categories={categories}
								orderOptions={orderOptions}
								autoSubmitImages
							/>
						</FormSection>
						<ActiveCheckbox defaultChecked={group.active} />
						<SubmitButton>Salvar</SubmitButton>
					</form>
				</CardContent>
			</EditorialPanel>

			<AdminVariantsPanel
				group={group}
				createStripeVariantAction={createStripeVariantAction}
				updateStripeVariantAction={updateStripeVariantAction}
				archiveStripeVariantAction={archiveStripeVariantAction}
			/>

			<EditorialPanel>
				<CardHeader>
					<CardTitle>Histórico</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="divide-y">
						{history.map((entry) => (
							<li key={String(entry._id)} className="py-3 space-y-1">
								<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
									<div className="font-medium">{entry.action.replaceAll("_", " ")}</div>
									<div className="text-xs text-muted-foreground">
										{new Date(entry.createdAt).toLocaleString()}
									</div>
								</div>
								<div className="text-sm text-muted-foreground">
									{entry.actorEmail || entry.actorId} · {entry.actorRole}
								</div>
								{entry.details ? (
									<pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
										{JSON.stringify(entry.details, null, 2)}
									</pre>
								) : null}
							</li>
						))}
						{history.length === 0 ? (
							<li className="py-6 text-muted-foreground">Nenhuma edição registrada.</li>
						) : null}
					</ul>
				</CardContent>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
