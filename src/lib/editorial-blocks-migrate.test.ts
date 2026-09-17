import { describe, expect, it } from "vitest";
import { convertLegacyEditorialContentToBlocks } from "@/lib/editorial-blocks-migrate";

describe("convertLegacyEditorialContentToBlocks", () => {
	it("returns an empty doc for missing content", () => {
		expect(convertLegacyEditorialContentToBlocks(null)).toEqual([]);
		expect(convertLegacyEditorialContentToBlocks(undefined)).toEqual([]);
		expect(convertLegacyEditorialContentToBlocks({})).toEqual([]);
	});

	it("maps title/eyebrow/summary/body into heading + paragraph blocks, in order", () => {
		const doc = convertLegacyEditorialContentToBlocks({
			title: "Sarau Safado",
			eyebrow: "Programação",
			summary: "Um encontro para quem ama literatura erótica.",
			body: "Curadoria de Natália Nolli Sasso.",
		});

		expect(doc).toEqual([
			{ id: "heading-0", type: "heading", level: 2, text: "Sarau Safado" },
			{ id: "paragraph-1", type: "paragraph", text: "Programação" },
			{ id: "paragraph-2", type: "paragraph", text: "Um encontro para quem ama literatura erótica." },
			{ id: "paragraph-3", type: "paragraph", text: "Curadoria de Natália Nolli Sasso." },
		]);
	});

	it("skips a body identical to the summary instead of duplicating it", () => {
		const doc = convertLegacyEditorialContentToBlocks({
			title: "Sobre",
			summary: "Mesma coisa.",
			body: "Mesma coisa.",
		});

		expect(doc.filter((block) => block.type === "paragraph")).toHaveLength(1);
	});

	it("ignores non-string fields instead of throwing", () => {
		expect(convertLegacyEditorialContentToBlocks({ title: 42, summary: null })).toEqual([]);
	});
});
