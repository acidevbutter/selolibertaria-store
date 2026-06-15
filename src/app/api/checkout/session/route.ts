import { createCheckoutSession } from "@/actions/checkout-actions";
import { requireSelolibertariaBuyer } from "@/lib/api-auth";

export async function POST() {
	const auth = await requireSelolibertariaBuyer();
	if ("error" in auth) return auth.error;
	const res = await createCheckoutSession();
	if ("requireAuth" in res) {
		return new Response(JSON.stringify({ requireAuth: true }), { status: 401 });
	}
	if ("error" in res) {
		return new Response(JSON.stringify({ error: res.error }), { status: 400 });
	}
	return Response.json(res);
}
