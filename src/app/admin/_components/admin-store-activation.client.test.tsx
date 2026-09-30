import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/ativacao/activation-actions", () => ({
	activateSiteAction: vi.fn(),
	deactivateSiteAction: vi.fn(),
}));

const { AdminStoreActivation } = await import("./admin-store-activation.client");

describe("AdminStoreActivation", () => {
	afterEach(cleanup);

	it("prints (de)activation times in São Paulo time whatever zone the runtime is in (hydration-safe)", () => {
		// 2026-09-30T03:30Z is 00:30 in São Paulo (UTC-3) but 03:30 when formatted in UTC.
		render(
			<AdminStoreActivation
				initial={{ activated: true, activatedAt: "2026-09-30T03:30:00Z", deactivatedAt: null }}
			/>,
		);

		expect(screen.getByText(/Ativada em/).textContent).toMatch(/30\/09\/2026.*00:30/);
	});

	it("shows the deactivated state with its time", () => {
		render(
			<AdminStoreActivation
				initial={{
					activated: false,
					activatedAt: "2026-09-20T12:00:00Z",
					deactivatedAt: "2026-09-30T15:00:00Z",
				}}
			/>,
		);

		expect(screen.getByText("Loja desativada")).toBeTruthy();
		expect(screen.getByText(/Desativada em/).textContent).toMatch(/30\/09\/2026.*12:00/);
		expect(screen.getByRole("button", { name: "Ativar loja" })).toBeTruthy();
	});
});
