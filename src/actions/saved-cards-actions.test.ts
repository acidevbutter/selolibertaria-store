import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	deleteSavedCardForUser: vi.fn(),
	revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/api-auth", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/saved-cards", () => ({ deleteSavedCardForUser: mocks.deleteSavedCardForUser }));

import { deleteSavedCard } from "./saved-cards-actions";

describe("deleteSavedCard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("recusa sem um id de cartão", async () => {
		expect(await deleteSavedCard("")).toEqual({ error: "ID do cartão ausente" });
		expect(mocks.requireAuth).not.toHaveBeenCalled();
	});

	it("recusa quando o usuário não está autenticado", async () => {
		mocks.requireAuth.mockResolvedValue({ error: new Response(null, { status: 401 }) });
		expect(await deleteSavedCard("card_1")).toEqual({ error: "Não autorizado" });
		expect(mocks.deleteSavedCardForUser).not.toHaveBeenCalled();
	});

	it("remove o cartão e revalida a página da conta", async () => {
		mocks.requireAuth.mockResolvedValue({ session: { sub: "user_1" } });
		mocks.deleteSavedCardForUser.mockResolvedValue(undefined);

		const result = await deleteSavedCard("card_1");

		expect(result).toEqual({ ok: true });
		expect(mocks.deleteSavedCardForUser).toHaveBeenCalledWith("card_1");
		expect(mocks.revalidatePath).toHaveBeenCalledWith("/user");
	});

	it("propaga uma falha do backend como erro amigável", async () => {
		mocks.requireAuth.mockResolvedValue({ session: { sub: "user_1" } });
		mocks.deleteSavedCardForUser.mockRejectedValue(new Error("boom"));

		expect(await deleteSavedCard("card_1")).toEqual({ error: "Não foi possível remover o cartão" });
	});
});
