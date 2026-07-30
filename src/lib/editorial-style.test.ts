import { describe, expect, it } from "vitest";
import {
	DEFAULT_EDITORIAL_TEXT_STYLE,
	readEditorialText,
	serializeEditorialText,
} from "@/lib/editorial-style";

describe("editorial text style", () => {
	it("keeps legacy text with Editorial V2 defaults", () => {
		expect(readEditorialText("Texto legado")).toEqual({
			source: "Texto legado",
			style: DEFAULT_EDITORIAL_TEXT_STYLE,
		});
	});
	it("serializes only allowed tokens", () => {
		const value = serializeEditorialText("Texto", "font=sans;scale=lg;color=wine;emphasis=strong;unsafe=css");
		expect(readEditorialText(value)).toEqual({
			source: "Texto",
			style: { font: "sans", scale: "lg", color: "wine", emphasis: "strong" },
		});
	});
});
