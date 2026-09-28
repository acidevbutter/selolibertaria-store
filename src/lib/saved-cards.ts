import "server-only";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";

export interface SavedCardViewModel {
	id: string;
	provider: string;
	brand: string | null;
	last4: string | null;
	createdAt: string;
}

type FastApiSavedCard = {
	id: string;
	provider: string;
	brand: string | null;
	last4: string | null;
	created_at: string;
};

async function authorization() {
	const token = (await cookies()).get("session")?.value;
	if (!token) throw new Error("Autenticação obrigatória");
	return { authorization: `Bearer ${token}` };
}

export async function listSavedCardsForUser(): Promise<SavedCardViewModel[]> {
	const response = await fetch(`${env.FASTAPI_API_URL}/users/me/saved-cards`, {
		headers: await authorization(),
		cache: "no-store",
	});
	if (!response.ok) throw new Error("Cartões salvos indisponíveis");
	return ((await response.json()) as FastApiSavedCard[]).map((card) => ({
		id: card.id,
		provider: card.provider,
		brand: card.brand,
		last4: card.last4,
		createdAt: card.created_at,
	}));
}

export async function deleteSavedCardForUser(cardId: string): Promise<void> {
	const response = await fetch(`${env.FASTAPI_API_URL}/users/me/saved-cards/${encodeURIComponent(cardId)}`, {
		method: "DELETE",
		headers: await authorization(),
		cache: "no-store",
	});
	if (!response.ok && response.status !== 404) throw new Error("Falha ao remover o cartão salvo");
}
