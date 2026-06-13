import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { commerce } from "@/lib/commerce-stripe";
import { toggleFavorite } from "@/lib/favorites";

export async function POST(req: NextRequest) {
	const auth = await requireAuth();
	if ("error" in auth) return auth.error;

	try {
		const body = (await req.json()) as { productSlug?: string; variantId?: string | null };
		const productSlug = body.productSlug?.trim();
		const variantId = body.variantId?.trim() || null;
		if (!productSlug) {
			return new Response(JSON.stringify({ error: "Slug do produto ausente" }), { status: 400 });
		}

		const product = await commerce.product.get({ slug: productSlug });
		if (!product) {
			return new Response(JSON.stringify({ error: "Produto não encontrado" }), { status: 404 });
		}

		const selectedVariant = product.variants?.find((variant) => variant.id === variantId) ?? null;
		const result = await toggleFavorite({
			userId: auth.session.sub as string,
			productSlug: product.slug,
			variantId,
			productId: selectedVariant?.productId ?? product.id,
			name: product.name,
			image: selectedVariant?.images?.[0] || product.images[0] || null,
			variantLabel: selectedVariant?.label ?? null,
		});

		return Response.json(result);
	} catch (error) {
		console.error("[POST /api/user/favorites]", error);
		return new Response(JSON.stringify({ error: "Falha ao atualizar favoritos" }), { status: 500 });
	}
}
