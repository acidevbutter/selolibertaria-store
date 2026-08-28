import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorialLivePreview } from "./editorial-live-preview.client";

vi.mock("@/ui/shadcn/dialog", () => ({
	Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
	DialogTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/ui/shadcn/tabs", () => ({
	Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	TabsTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
	TabsContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("EditorialLivePreview", () => {
	afterEach(() => window.sessionStorage.clear());

	it("espelha alterações locais e descarta somente o rascunho da sessão", async () => {
		render(
			<form id="editorial-test-form">
				<input name="heroTitle" defaultValue="Título publicado" />
				<input name="heroBody" defaultValue="Texto publicado" />
				<EditorialLivePreview formId="editorial-test-form" pageTitle="Sobre" published />
			</form>,
		);

		fireEvent.input(screen.getByDisplayValue("Título publicado"), {
			target: { value: "Título em rascunho" },
		});
		expect(await screen.findByText("Título em rascunho")).toBeInTheDocument();
		expect(window.sessionStorage.getItem("selo-editorial-draft:editorial-test-form")).toContain(
			"Título em rascunho",
		);

		fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
		await waitFor(() => expect(screen.getByDisplayValue("Título publicado")).toBeInTheDocument());
		expect(window.sessionStorage.getItem("selo-editorial-draft:editorial-test-form")).toBeNull();
	});

	it("restaura o rascunho local sem consultar ou persistir no servidor", async () => {
		window.sessionStorage.setItem(
			"selo-editorial-draft:editorial-restored-form",
			JSON.stringify({ heroTitle: ["Rascunho restaurado"] }),
		);
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		render(
			<form id="editorial-restored-form">
				<input name="heroTitle" defaultValue="Título publicado" />
				<EditorialLivePreview formId="editorial-restored-form" pageTitle="Sobre" published />
			</form>,
		);

		await waitFor(() => expect(screen.getByDisplayValue("Rascunho restaurado")).toBeInTheDocument());
		expect(fetchMock).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});
});
