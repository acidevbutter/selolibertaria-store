import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	auth: async () => ({ user: { id: "u1", role: "admin", name: "Marina", email: "marina@selo.test" } }),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "session-token" }) }) }));
vi.mock("@/env.mjs", () => ({
	env: { FASTAPI_API_URL: "http://localhost:8000", FASTAPI_INTERNAL_API_KEY: "k" },
}));

const { listPresalesAction, savePresaleDraftAction, listPresaleReservationsAction } = await import(
	"@/app/admin/pre-venda/presale-actions"
);

function json(status: number, body: unknown) {
	return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const backendPresale = {
	id: "p1",
	product_id: "product_little-fish-big-fish",
	variant_id: "variant_little-fish-big-fish_impresso",
	launch_at: "2026-10-30T22:00:00Z",
	presale_price: 3990,
	full_price: 4990,
	published: true,
	status: "no_ar",
	modal_enabled: true,
	modal_interval_hours: 2,
	modal_title: "t",
	modal_body: "b",
	reservations_count: 3,
	amount_to_charge: 11970,
};

describe("presale actions: backend centavos <-> store reais", () => {
	let fetchMock: ReturnType<typeof vi.fn>;
	beforeEach(() => {
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
	});
	afterEach(() => vi.unstubAllGlobals());

	it("lists presales with prices in reais (49,90 -- not 4990,00)", async () => {
		fetchMock.mockResolvedValueOnce(json(200, [backendPresale]));

		const [presale] = await listPresalesAction();

		expect(presale).toMatchObject({ presalePrice: 39.9, fullPrice: 49.9, amountToCharge: 119.7 });
	});

	it("lists reservations with amounts in reais", async () => {
		fetchMock.mockResolvedValueOnce(
			json(200, [{ id: "r1", amount: 3990, charge_status: "cobrado", created_at: "2026-09-30T00:00:00Z" }]),
		);

		const [reservation] = await listPresaleReservationsAction("p1");

		expect(reservation?.amount).toBe(39.9);
	});

	it("saves the price an editor typed in reais as centavos", async () => {
		fetchMock.mockResolvedValueOnce(json(200, backendPresale));

		const state = await savePresaleDraftAction("p1", {
			presalePrice: 39.9,
			fullPrice: 49.9,
			modalTitle: "x",
		});

		expect(state.status).toBe("saved");
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("http://localhost:8000/presales/p1");
		expect(init.method).toBe("PATCH");
		expect(JSON.parse(String(init.body))).toMatchObject({
			presale_price: 3990,
			full_price: 4990,
			modal_title: "x",
		});
	});

	it("leaves prices out of the PATCH when the patch does not carry them", async () => {
		fetchMock.mockResolvedValueOnce(json(200, backendPresale));

		await savePresaleDraftAction("p1", { modalTitle: "só o título" });

		const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));
		expect(body.presale_price).toBeUndefined();
		expect(body.full_price).toBeUndefined();
	});
});
