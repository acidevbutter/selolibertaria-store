import "server-only";

import { env } from "@/env.mjs";
import type { CheckoutBuyerDraft } from "@/lib/checkout-buyer";
import type { CheckoutAddress } from "@/lib/shipping-core";

export interface CheckoutIdentityDraft {
	orderId: string;
	userId?: string | null;
	buyer?: CheckoutBuyerDraft | null;
	deliveryAddress?: CheckoutAddress | null;
}

export async function resolveCheckoutUserForDraft(draft: CheckoutIdentityDraft) {
	const buyer = draft.buyer;
	if (!buyer?.email) throw new Error("Missing checkout buyer email");
	const response = await fetch(`${env.FASTAPI_API_URL}/auth/internal/checkout-user`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY,
		},
		body: JSON.stringify({
			email: buyer.email,
			full_name: buyer.fullName,
			cpf: buyer.cpf || null,
			phone: buyer.phone || null,
		}),
		cache: "no-store",
	});
	if (!response.ok) throw new Error("Não foi possível preparar a conta da compra");
	const payload = (await response.json()) as { user: { id: string }; created: boolean };
	return { userId: payload.user.id, created: payload.created };
}
