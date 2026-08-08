import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";

describe("EditorialRichText", () => {
	it("renders legacy plain text paragraph", () => {
		render(<EditorialRichText source="Texto legado sem marcação." />);

		expect(screen.getByText("Texto legado sem marcação.").closest("p")).toBeTruthy();
	});

	it("renders minimal editorial text marks", () => {
		render(
			<EditorialRichText source={"### Intertítulo\n\nTexto com **força** e _ênfase_.\n\n> Uma citação"} />,
		);

		expect(screen.getByRole("heading", { name: "Intertítulo", level: 3 })).toBeTruthy();
		expect(screen.getByText("força").tagName).toBe("STRONG");
		expect(screen.getByText("ênfase").tagName).toBe("EM");
		expect(screen.getByText("Uma citação").closest("blockquote")).toBeTruthy();
	});

	it("normalizes inline block markers saved in the same line", () => {
		render(<EditorialRichText source="Livro, presença e linguagem. > Trecho em citação ### EU QUERO" />);

		expect(screen.getByText("Livro, presença e linguagem.").closest("p")).toBeTruthy();
		expect(screen.getByText("Trecho em citação").closest("blockquote")).toBeTruthy();
		expect(screen.getByRole("heading", { name: "EU QUERO", level: 3 })).toBeTruthy();
	});

	it("keeps html-like legacy content escaped", () => {
		render(<EditorialRichText source={"<script>alert('x')</script>"} />);

		expect(screen.getByText("<script>alert('x')</script>")).toBeTruthy();
	});

	it("applies safe styles stored with the editorial text", () => {
		render(
			<EditorialRichText
				source={"<!-- editorial-style:font=sans;scale=lg;color=wine;emphasis=strong -->\nTexto"}
			/>,
		);
		expect(screen.getByText("Texto").closest("div")).toHaveClass("font-sans", "text-lg", "font-semibold");
	});
});
