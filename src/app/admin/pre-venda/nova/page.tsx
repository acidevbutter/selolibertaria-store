import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { getCatalogManagementProductBySlug } from "@/lib/catalog";
import { getPresaleByProduct, LFBF_PRODUCT_ID } from "@/lib/presales";
import { AdminEditorialHero, AdminEditorialPage } from "@/ui/editorial/editorial-primitives";
import { PresaleWizard } from "./presale-wizard.client";

export const dynamic = "force-dynamic";

export default async function NovaPresalePage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "catalog.write")) redirect("/forbidden");

	const product = await getCatalogManagementProductBySlug("little-fish-big-fish");
	const variant = product?.variants[0];
	if (!product || !variant) notFound();
	const presale = await getPresaleByProduct(LFBF_PRODUCT_ID);

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Pré-vendas / Nova"
				title="Abrir a pré-venda"
				description="little fish, big fish · Natália Nolli Sasso"
			/>
			<PresaleWizard
				initialPresale={presale}
				productId={product.id}
				variantId={variant.id}
				fallbackFullPriceCents={variant.price}
			/>
		</AdminEditorialPage>
	);
}
