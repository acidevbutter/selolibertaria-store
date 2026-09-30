import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MetricCard } from "@/app/admin/_components/ui/MetricCard";
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
		<>
			<div className="ad-head">
				<h1>{group.name}</h1>
				<span className="ad-meta">Slug: {group.slug}</span>
				<div className="ad-acts">
					<Link className="ad-btn ad-sec" href="/admin/products">
						<ArrowLeft className="h-4 w-4" />
						Voltar para produtos
					</Link>
					<StatusBadge tone={group.active ? "active" : "neutral"}>
						{group.active ? "Ativo" : "Inativo"}
					</StatusBadge>
				</div>
			</div>

			<div className="grid gap-5 lg:grid-cols-3">
				<MetricCard label="Variantes" value={group.variants.length} note="Itens cadastrados neste produto." />
				<MetricCard label="Ativas" value={activeVariants} note="Variantes disponíveis no catálogo." />
				<MetricCard
					label="Categoria"
					value={group.category || "Categoria não informada"}
					note="Classificação principal do produto."
				/>
			</div>

			<div className="ad-panel">
				<div style={{ padding: 24 }}>
					<h2 className="ad-eb">Dados do produto</h2>
					<form action={updateProductGroupAction} className="mt-6 space-y-6">
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
				</div>
			</div>

			<AdminVariantsPanel
				group={group}
				locale={displayLocale}
				adminCurrency={adminCurrency}
				createVariantAction={createVariantAction}
				updateVariantAction={updateVariantAction}
				archiveVariantAction={archiveVariantAction}
			/>

			<div className="ad-panel">
				<div style={{ padding: 24 }}>
					<h2 className="ad-eb">Histórico do produto</h2>
					<ul className="mt-4 divide-y divide-[var(--ad-line-quiet)]">
						{history.map((entry) => (
							<li key={String(entry._id)} className="space-y-1 py-3">
								<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
									<div className="font-medium">{getAuditActionLabel(entry.action)}</div>
									<div className="ad-mono text-xs text-[var(--ad-text-soft)]">
										{new Date(entry.createdAt).toLocaleString(displayLocale)}
									</div>
								</div>
								<div className="text-sm text-[var(--ad-text-soft)]">
									{entry.actorEmail || entry.actorId} · {getActorRoleLabel(entry.actorRole)}
								</div>
								{entry.details ? (
									<pre className="ad-mono overflow-x-auto border border-[var(--ad-line)] bg-[var(--ad-sand)] p-3 text-xs text-[var(--ad-text-soft)]">
										{JSON.stringify(entry.details, null, 2)}
									</pre>
								) : null}
							</li>
						))}
						{history.length === 0 ? (
							<li className="py-6 text-[var(--ad-text-soft)]">Nenhum registro recente neste produto.</li>
						) : null}
					</ul>
				</div>
			</div>
		</>
	);
}
