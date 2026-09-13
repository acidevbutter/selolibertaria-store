import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/app/admin/_components/ui/StatusBadge";
import { AdminVariantsPanel } from "@/app/admin/products/_components/admin-variants-panel.client";
import {
	ActiveCheckbox,
	FormSection,
	ProductCoreFields,
	SubmitButton,
} from "@/app/admin/products/_components/product-form-fields";
import {
	archiveVariantAction,
	createVariantAction,
	updateProductGroupAction,
	updateVariantAction,
} from "@/app/admin/products/actions";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { getAdminProductGroup, listAdminProductGroups } from "@/lib/admin-products";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { listProductAuditEntries } from "@/lib/product-audit";
import { listSystemCategories } from "@/lib/product-categories";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";

export const dynamic = "force-dynamic";

function getAuditActionLabel(action: string) {
	switch (action) {
		case "product_group_created":
			return "Produto criado";
		case "product_group_updated":
			return "Produto atualizado";
		case "product_variant_created":
			return "Variante criada";
		case "product_variant_updated":
			return "Variante atualizada";
		case "product_variant_archived":
			return "Variante arquivada";
		default:
			return action.replaceAll("_", " ");
	}
}

function getActorRoleLabel(role: string) {
	switch (role) {
		case "admin":
			return "Administrador";
		case "vendor":
			return "Vendedor";
		case "customer":
			return "Cliente";
		default:
			return role;
	}
}

export default async function AdminProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "catalog.write")) redirect("/forbidden");

	const { slug: rawSlug } = await params;
	const slug = decodeURIComponent(rawSlug);
	const [group, categories, groups] = await Promise.all([
		getAdminProductGroup(slug),
		listSystemCategories(),
		listAdminProductGroups(),
	]);
	if (!group) redirect("/admin/products");
	const history = await listProductAuditEntries(group.slug, 15);
	const displayLocale = (await getDefaultLocaleSetting()) ?? DEFAULT_LOCALE;
	const adminCurrency = "BRL".trim().toUpperCase();
	const currentOrder = Number.parseInt(group.order || "", 10);
	const orderCount = Number.isFinite(currentOrder) ? groups.length : groups.length + 1;
	const orderOptions = Array.from({ length: orderCount }, (_, index) => index + 1);
	const activeVariants = group.variants.filter((variant) => variant.active).length;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Produto"
				title={group.name}
				description="Edite os dados principais do produto, acompanhe variantes e revise o histórico sem sair do catálogo."
				actions={
					<div className="flex flex-wrap items-center gap-3">
						<Link
							href="/admin/products"
							className="inline-flex items-center gap-2 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-4 py-3 text-sm text-[var(--sl-text-muted)] transition-colors hover:text-[var(--sl-ink)]"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar para produtos
						</Link>
						<div className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-4 py-3">
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
								Slug
							</div>
							<div className="mt-2 font-mono text-xs text-[var(--sl-text-muted)]">{group.slug}</div>
						</div>
						<StatusBadge tone={group.active ? "active" : "neutral"}>
							{group.active ? "Ativo" : "Inativo"}
						</StatusBadge>
					</div>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Variantes"
					value={group.variants.length}
					helper="Itens cadastrados neste produto."
				/>
				<AdminEditorialStat
					label="Ativas"
					value={activeVariants}
					helper="Variantes disponíveis no catálogo."
				/>
				<AdminEditorialStat
					label="Categoria"
					value={group.category || "Categoria não informada"}
					helper="Classificação principal do produto."
				/>
			</div>

			<EditorialPanel>
				<h2 className="editorial-serif mb-6 text-xl font-semibold text-[var(--sl-ink)]">Dados do produto</h2>
				<form action={updateProductGroupAction} className="space-y-6">
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
							productType={group.productType}
							format={group.format}
							categories={categories}
							orderOptions={orderOptions}
							autoSubmitImages
							autoFormatSlug
						/>
					</FormSection>
					<ActiveCheckbox defaultChecked={group.active} />
					<SubmitButton>Salvar produto</SubmitButton>
				</form>
			</EditorialPanel>

			<AdminVariantsPanel
				group={group}
				locale={displayLocale}
				adminCurrency={adminCurrency}
				createVariantAction={createVariantAction}
				updateVariantAction={updateVariantAction}
				archiveVariantAction={archiveVariantAction}
			/>

			<EditorialPanel>
				<h2 className="editorial-serif mb-4 text-xl font-semibold text-[var(--sl-ink)]">
					Histórico do produto
				</h2>
				<ul className="divide-y divide-[var(--sl-line)]">
					{history.map((entry) => (
						<li key={String(entry._id)} className="space-y-1 py-3">
							<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
								<div className="font-medium">{getAuditActionLabel(entry.action)}</div>
								<div className="text-xs text-[var(--sl-text-muted)]">
									{new Date(entry.createdAt).toLocaleString(displayLocale)}
								</div>
							</div>
							<div className="text-sm text-[var(--sl-text-muted)]">
								{entry.actorEmail || entry.actorId} · {getActorRoleLabel(entry.actorRole)}
							</div>
							{entry.details ? (
								<pre
									className="overflow-x-auto border bg-[var(--sl-surface-quiet)] p-3 text-xs text-[var(--sl-text-muted)]"
									style={{ borderRadius: "var(--sl-radius)" }}
								>
									{JSON.stringify(entry.details, null, 2)}
								</pre>
							) : null}
						</li>
					))}
					{history.length === 0 ? (
						<li className="py-6 text-[var(--sl-text-muted)]">Nenhum registro recente neste produto.</li>
					) : null}
				</ul>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
