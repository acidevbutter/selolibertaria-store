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
});
