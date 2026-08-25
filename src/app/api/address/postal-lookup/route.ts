import { env } from "@/env.mjs";

export async function GET(request: Request) {
	const input = new URL(request.url).search;
	const response = await fetch(`${env.FASTAPI_API_URL}/address/postal-lookup${input}`, {
		cache: "no-store",
	});
	return new Response(await response.text(), {
		status: response.status,
		headers: { "Content-Type": "application/json" },
	});
}
