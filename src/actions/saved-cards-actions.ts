"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/api-auth";
import { deleteSavedCardForUser } from "@/lib/saved-cards";

export async function deleteSavedCard(cardId: string) {
	if (!cardId) return { error: "ID do cartão ausente" } as const;
	const auth = await requireAuth();
	if ("error" in auth) return { error: "Não autorizado" } as const;
	try {
		await deleteSavedCardForUser(cardId);
		revalidatePath("/user");
		return { ok: true as const };
	} catch {
		return { error: "Não foi possível remover o cartão" } as const;
	}
}
