import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type { EditorialContentDoc } from "@/lib/editorial-blocks";
import { EditorialBlocksRenderer } from "./editorial-blocks-renderer";

vi.mock("next/image", () => ({
	default: ({ src, alt, unoptimized: _unoptimized, ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
		// eslint-disable-next-line @next/next/no-img-element
		<img src={String(src)} alt={alt ?? ""} {...props} />
	),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ prefetch: vi.fn() }),
}));

const sampleDoc: EditorialContentDoc = [
	{ id: "b1", type: "heading", level: 2, text: "Um **título** em destaque" },
	{ id: "b2", type: "paragraph", text: "Um parágrafo com *ênfase* no meio." },
	{
		id: "b3",
		type: "image",
		assetId: "asset-1",
		cropId: "wide",
		src: "https://cdn.example.com/asset-1-wide.jpg",
		layout: "wide",
		caption: "Legenda da imagem",
		alt: "Descrição da imagem",
	},
	{ id: "b4", type: "quote", text: "Uma citação", attribution: "Alguém" },
	{ id: "b5", type: "list", style: "bullet", items: ["Item 1", "Item 2"] },
	{ id: "b6", type: "divider" },
	{ id: "b7", type: "button", label: "Saiba mais", href: "/contact", variant: "primary" },
];

// Two independent call sites, mirroring how the admin "ver como fica" preview
// and the public page will each import the shared renderer.
function AdminPreviewConsumer({ doc }: { doc: EditorialContentDoc }) {
	return (
		<div data-context="admin-preview">
			<EditorialBlocksRenderer doc={doc} />
		</div>
	);
}

function PublicPageConsumer({ doc }: { doc: EditorialContentDoc }) {
	return (
		<article data-context="public-page">
			<EditorialBlocksRenderer doc={doc} />
		</article>
	);
}

describe("EditorialBlocksRenderer", () => {
	it("renders every closed block type without throwing", () => {
		const { container } = render(<EditorialBlocksRenderer doc={sampleDoc} />);
		expect(container.querySelector("h2")).toHaveTextContent("título");
		expect(container.querySelector("blockquote")).toHaveTextContent("Uma citação");
		expect(container.querySelector("img")).toHaveAttribute("alt", "Descrição da imagem");
		expect(container.querySelector("a")).toHaveAttribute("href", "/contact");
	});

	it("produces identical markup for the admin preview and the public page (same renderer, same doc)", () => {
		const admin = render(<AdminPreviewConsumer doc={sampleDoc} />);
		const adminHtml = admin.container.querySelector('[data-context="admin-preview"]')?.innerHTML;
		admin.unmount();

		const publicPage = render(<PublicPageConsumer doc={sampleDoc} />);
		const publicHtml = publicPage.container.querySelector('[data-context="public-page"]')?.innerHTML;
		publicPage.unmount();

		expect(adminHtml).toBeTruthy();
		expect(adminHtml).toBe(publicHtml);
	});

	it("never uses dangerouslySetInnerHTML in the renderer source", () => {
		const sourcePath = join(process.cwd(), "src/ui/editorial/editorial-blocks-renderer.tsx");
		const source = readFileSync(sourcePath, "utf-8");
		expect(source).not.toContain("dangerouslySetInnerHTML");
	});

	it("returns null for an empty document", () => {
		const { container } = render(<EditorialBlocksRenderer doc={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it('skips an image block with an empty src instead of passing "" to next/image', () => {
		const docWithEmptyImage: EditorialContentDoc = [
			{ id: "b1", type: "heading", level: 2, text: "Título" },
			{
				id: "b2",
				type: "image",
				assetId: "",
				cropId: null,
				src: "",
				layout: "wide",
				align: null,
				caption: null,
				href: null,
				alt: null,
			},
		];
		const { container } = render(<EditorialBlocksRenderer doc={docWithEmptyImage} />);
		expect(container.querySelector("h2")).toHaveTextContent("Título");
		expect(container.querySelector("img")).toBeNull();
		expect(container.querySelector("figure")).toBeNull();
	});

	it("skips a gallery image with an empty src while keeping the rest", () => {
		const docWithPartialGallery: EditorialContentDoc = [
			{
				id: "b1",
				type: "gallery",
				images: [
					{ assetId: "a1", cropId: null, src: "https://cdn.example.com/a1.jpg", caption: null, alt: null },
					{ assetId: "", cropId: null, src: "", caption: null, alt: null },
				],
			},
		];
		const { container } = render(<EditorialBlocksRenderer doc={docWithPartialGallery} />);
		expect(container.querySelectorAll("img")).toHaveLength(1);
		expect(container.querySelector("img")).toHaveAttribute("src", "https://cdn.example.com/a1.jpg");
	});

	it("gives a half-width block a narrower responsive class so it can sit beside another", () => {
		const twoColumns: EditorialContentDoc = [
			{ id: "b1", type: "paragraph", text: "Esquerda", width: "half" },
			{ id: "b2", type: "paragraph", text: "Direita", width: "half" },
		];
		const { container } = render(<EditorialBlocksRenderer doc={twoColumns} />);
		const wrappers = container.querySelectorAll(":scope > div > div");
		expect(wrappers).toHaveLength(2);
		for (const wrapper of wrappers) {
			expect(wrapper.className).toContain("sm:w-[calc(50%-10px)]");
		}
	});

	it("defaults a block with no explicit width to the full row", () => {
		const { container } = render(
			<EditorialBlocksRenderer doc={[{ id: "b1", type: "paragraph", text: "Sozinho" }]} />,
		);
		const wrapper = container.querySelector(":scope > div > div") as HTMLElement;
		expect(wrapper.className).toContain("w-full");
		expect(wrapper.className).not.toContain("calc(50%");
	});

	it("renders an image's credit distinct from its caption, and tolerates either alone", () => {
		const withBoth: EditorialContentDoc = [
			{
				id: "b1",
				type: "image",
				assetId: "a",
				cropId: null,
				src: "https://cdn.example.com/a.jpg",
				layout: "wide",
				caption: "Uma legenda",
				credit: "Foto: Fulano",
				alt: null,
			},
		];
		const { container, rerender } = render(<EditorialBlocksRenderer doc={withBoth} />);
		expect(container.querySelector("figcaption")?.textContent).toBe("Uma legenda Foto: Fulano");

		const creditOnly: EditorialContentDoc = [
			{ ...withBoth[0], caption: null } as EditorialContentDoc[number],
		];
		rerender(<EditorialBlocksRenderer doc={creditOnly} />);
		expect(container.querySelector("figcaption")?.textContent).toBe("Foto: Fulano");

		const neither: EditorialContentDoc = [
			{ ...withBoth[0], caption: null, credit: null } as EditorialContentDoc[number],
		];
		rerender(<EditorialBlocksRenderer doc={neither} />);
		expect(container.querySelector("figcaption")).toBeNull();
	});

	it("renders a gallery image's credit distinct from its caption", () => {
		const docs: EditorialContentDoc = [
			{
				id: "b1",
				type: "gallery",
				images: [
					{
						assetId: "a1",
						cropId: null,
						src: "https://cdn.example.com/a1.jpg",
						caption: "Legenda da galeria",
						credit: "Foto: Ciclana",
						alt: null,
					},
				],
			},
		];
		const { container } = render(<EditorialBlocksRenderer doc={docs} />);
		expect(container.querySelector("figcaption")?.textContent).toBe("Legenda da galeria Foto: Ciclana");
	});

	it("renders a section divider once, before the first block of each new section", () => {
		const doc: EditorialContentDoc = [
			{ id: "b1", type: "heading", level: 2, text: "Título do hero", section: "Hero" },
			{ id: "b2", type: "paragraph", text: "Blurb do hero", section: "Hero" },
			{ id: "b3", type: "heading", level: 2, text: "Título do manifesto", section: "Manifesto" },
		];
		const { container } = render(<EditorialBlocksRenderer doc={doc} />);
		const labels = Array.from(container.querySelectorAll("p")).map((p) => p.textContent);
		expect(labels).toEqual(["Hero", "Blurb do hero", "Manifesto"]);
	});

	it("groups blocks sharing a row id into a left/right column layout, even if not adjacent", () => {
		const doc: EditorialContentDoc = [
			{ id: "left1", type: "heading", level: 2, text: "Esquerda 1", row: "hero", column: "left" },
			{ id: "unrelated", type: "divider" },
			{ id: "left2", type: "paragraph", text: "Esquerda 2", row: "hero", column: "left" },
			{ id: "right1", type: "paragraph", text: "Direita 1", row: "hero", column: "right" },
		];
		const { container } = render(<EditorialBlocksRenderer doc={doc} />);
		const columns = container.querySelectorAll(":scope > div > div.grid > div");
		expect(columns).toHaveLength(2);
		expect(columns[0]?.textContent).toBe("Esquerda 1Esquerda 2");
		expect(columns[1]?.textContent).toBe("Direita 1");
	});

	it("renders a single column when a row has no right-column blocks", () => {
		const doc: EditorialContentDoc = [
			{ id: "left1", type: "paragraph", text: "Sozinho na esquerda", row: "solo", column: "left" },
		];
		const { container } = render(<EditorialBlocksRenderer doc={doc} />);
		const rowWrapper = container.querySelector(":scope > div > div.grid") as HTMLElement;
		expect(rowWrapper.className).toContain("grid-cols-1");
		expect(rowWrapper.className).not.toContain("sm:grid-cols-2");
		expect(rowWrapper.querySelectorAll(":scope > div")).toHaveLength(1);
	});
});
