import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EditorialContentDoc } from "@/lib/editorial-blocks";
import { EditorialBlocksEditor } from "./editorial-blocks-editor.client";

function doc(): EditorialContentDoc {
	return [
		{ id: "a", type: "paragraph", text: "primeiro parágrafo" },
		{ id: "b", type: "paragraph", text: "segundo parágrafo" },
	];
}

function hiddenValue(container: HTMLElement, name: string) {
	const input = container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
	return JSON.parse(input.value) as EditorialContentDoc;
}

describe("EditorialBlocksEditor", () => {
	it("inserts a divider block via the toolbar without touching code", () => {
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);
		fireEvent.click(screen.getByRole("button", { name: "Separador" }));

		const next = hiddenValue(container, "content");
		expect(next).toHaveLength(3);
		expect(next.some((block) => block.type === "divider")).toBe(true);
	});

	it("duplicates and removes a block via its hover controls", () => {
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);

		fireEvent.click(screen.getAllByRole("button", { name: "Duplicar" })[0]);
		expect(hiddenValue(container, "content")).toHaveLength(3);

		fireEvent.click(screen.getAllByRole("button", { name: "Remover" })[0]);
		expect(hiddenValue(container, "content")).toHaveLength(2);
	});

	it("undoes an insertion back to the original document", () => {
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);

		fireEvent.click(screen.getByRole("button", { name: "Separador" }));
		expect(hiddenValue(container, "content")).toHaveLength(3);

		fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
		expect(hiddenValue(container, "content")).toEqual(doc());
	});

	it("never exposes a font, color, size or spacing control (fatia 02 hard limit)", () => {
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);
		const forbidden = ["font", "cor", "color", "tamanho", "espaçamento", "spacing"];
		const labels = Array.from(container.querySelectorAll("[aria-label], [title]")).map(
			(el) => el.getAttribute("aria-label") ?? el.getAttribute("title") ?? "",
		);
		for (const label of labels) {
			for (const term of forbidden) {
				expect(label.toLowerCase()).not.toContain(term);
			}
		}
	});
});
