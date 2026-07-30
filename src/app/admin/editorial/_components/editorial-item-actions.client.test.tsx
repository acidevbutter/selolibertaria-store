import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorialItemActions } from "./editorial-item-actions.client";

describe("EditorialItemActions", () => {
	it("updates the publish command and provides success feedback", async () => {
		const toggleAction = vi.fn(async () => undefined);

		render(
			<EditorialItemActions
				slug="evento-teste"
				published
				itemLabel="evento"
				toggleAction={toggleAction}
				deleteAction={async () => undefined}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Mover para rascunho" }));

		await waitFor(() => expect(toggleAction).toHaveBeenCalledTimes(1));
		expect(await screen.findByRole("status")).toHaveTextContent("Movido para rascunho com sucesso.");
		expect(screen.getByRole("button", { name: "Publicar" })).toBeTruthy();
	});

	it("keeps a clear error when a command fails", async () => {
		render(
			<EditorialItemActions
				slug="projeto-teste"
				published={false}
				itemLabel="projeto"
				toggleAction={async () => {
					throw new Error("Não foi possível atualizar o projeto.");
				}}
				deleteAction={async () => undefined}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

		expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível atualizar o projeto.");
	});

	it("does not run deletion when the confirmation is dismissed", () => {
		const deleteAction = vi.fn(async () => undefined);
		const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

		render(
			<EditorialItemActions
				slug="evento-teste"
				published
				itemLabel="evento"
				toggleAction={async () => undefined}
				deleteAction={deleteAction}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Excluir evento" }));

		expect(confirm).toHaveBeenCalledWith("Excluir este evento? Esta ação não pode ser desfeita.");
		expect(deleteAction).not.toHaveBeenCalled();
		confirm.mockRestore();
	});
});
