import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AdminMaintenanceNotice } from "./admin-maintenance-notice";

describe("AdminMaintenanceNotice", () => {
	afterEach(cleanup);

	it("tells the admin the store is in maintenance yet the panel stays open, and links to the toggle", () => {
		render(
			<AdminMaintenanceNotice
				activation={{
					activated: false,
					activatedAt: "2026-09-20T10:00:00Z",
					deactivatedAt: "2026-09-29T10:00:00Z",
				}}
			/>,
		);

		expect(screen.getByText("Loja em manutenção")).toBeTruthy();
		expect(screen.getByText(/O admin continua acessível/)).toBeTruthy();
		expect(screen.getByRole("link", { name: "Status da loja" }).getAttribute("href")).toBe("/admin/settings");
		// Already launched once: no launch wizard shortcut.
		expect(screen.queryByRole("link", { name: "Lançar com o assistente" })).toBeNull();
	});

	it("offers the optional launch wizard when the store was never activated", () => {
		render(
			<AdminMaintenanceNotice activation={{ activated: false, activatedAt: null, deactivatedAt: null }} />,
		);

		expect(screen.getByRole("link", { name: "Lançar com o assistente" }).getAttribute("href")).toBe(
			"/ativacao",
		);
	});

	it("does not claim a status when the backend could not be read", () => {
		render(<AdminMaintenanceNotice activation={null} />);

		expect(screen.getByText(/Não foi possível confirmar o status da loja/)).toBeTruthy();
		expect(screen.queryByRole("link", { name: "Lançar com o assistente" })).toBeNull();
	});
});
