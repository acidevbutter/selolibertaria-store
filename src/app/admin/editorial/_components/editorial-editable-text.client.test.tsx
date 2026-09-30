import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { EditableText } from "./editorial-editable-text.client";

function Harness({ initial, onRender }: { initial: string; onRender?: (value: string) => void }) {
	const [value, setValue] = useState(initial);
	onRender?.(value);
	return (
		<>
			<EditableText aria-label="campo" value={value} onValueChange={setValue} />
			<button type="button" onClick={() => setValue("texto vindo de fora")}>
				externo
			</button>
			<output data-testid="state">{value}</output>
		</>
	);
}

/** What the browser does when someone types: it mutates the text in place, then fires `input`. */
function type(element: HTMLElement, text: string) {
	element.textContent = text;
	fireEvent.input(element);
}

describe("EditableText", () => {
	afterEach(cleanup);

	it("shows the initial text", () => {
		render(<Harness initial="olá" />);
		expect(screen.getByRole("textbox", { name: "campo" }).textContent).toBe("olá");
	});

	it("does not replace the text node the browser is typing into (the cause of reversed text)", () => {
		render(<Harness initial="" />);
		const field = screen.getByRole("textbox", { name: "campo" });

		type(field, "o");
		const typedNode = field.firstChild;
		expect(typedNode).not.toBeNull();

		// A real keystroke edits the existing Text node in place (unlike `textContent =`, which swaps it).
		for (const text of ["ol", "olá"]) {
			(field.firstChild as Text).data = text;
			fireEvent.input(field);
		}

		// Same node all along: React never rewrote it, so a real caret would not jump to the start.
		expect(field.firstChild).toBe(typedNode);
		expect(field.textContent).toBe("olá");
		expect(screen.getByTestId("state").textContent).toBe("olá");
	});

	it("reports the plain text on every keystroke", () => {
		render(<Harness initial="" />);
		const field = screen.getByRole("textbox", { name: "campo" });
		for (const text of ["p", "pa", "par", "para"]) type(field, text);
		expect(screen.getByTestId("state").textContent).toBe("para");
	});

	it("pushes a value that changed from outside (undo/redo, shortcuts) into the DOM", () => {
		render(<Harness initial="antes" />);
		act(() => {
			fireEvent.click(screen.getByRole("button", { name: "externo" }));
		});
		expect(screen.getByRole("textbox", { name: "campo" }).textContent).toBe("texto vindo de fora");
	});

	it("is an editable textbox that pastes plain text only", () => {
		render(<Harness initial="" />);
		const field = screen.getByRole("textbox", { name: "campo" });
		expect(field.getAttribute("contenteditable")).toBe("true");
	});
});
