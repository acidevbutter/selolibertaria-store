import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";

describe("EditorialRichText", () => {
	it("renders legacy plain text as a paragraph", () => {
		render(<EditorialRichText source="Texto legado sem marcação." />);

		expect(screen.getByText("Texto legado sem marcação.").closest("p")).toBeTruthy();
	});

	it("renders the minimal editorial text marks", () => {
		render(
			<EditorialRichText source={"### Intertítulo\n\nTexto com **força** e _ênfase_.\n\n> Uma citação"} />,
		);

		expect(screen.getByRole("heading", { name: "Intertítulo", level: 3 })).toBeTruthy();
		expect(screen.getByText("força").tagName).toBe("STRONG");
		expect(screen.getByText("ênfase").tagName).toBe("EM");
		expect(screen.getByText("Uma citação").closest("blockquote")).toBeTruthy();
	});

	it("keeps html-like legacy content escaped", () => {
		render(<EditorialRichText source={"<script>alert('x')</script>"} />);

		expect(screen.getByText("<script>alert('x')</script>")).toBeTruthy();
	});
});
