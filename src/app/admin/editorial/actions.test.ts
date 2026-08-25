import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_IMAGE_UPLOAD_MAX_BYTES } from "@/lib/admin-image-upload";

const requireCapabilityMock = vi.fn();
const getDbMock = vi.fn();
const getEditorialRecordForAdminMock = vi.fn();
const updateOneMock = vi.fn();
const uploadImageFileToFastAPIMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
	throw new Error(`NEXT_REDIRECT:${path}`);
});
const revalidatePathMock = vi.fn();
const actionState = { status: "idle" as const, message: null, fieldErrors: {} };

vi.mock("server-only", () => ({}));

vi.mock("@/lib/api-auth", () => ({
	requireCapability: () => requireCapabilityMock(),
}));

vi.mock("@/lib/media-upload", () => ({
	uploadImageFileToFastAPI: (file: File) => uploadImageFileToFastAPIMock(file),
}));

vi.mock("@/lib/editorial-api-store", () => ({
	getEditorialApiStore: () => getDbMock(),
}));

vi.mock("@/lib/editorial-content-store", () => ({
	getEditorialEventRecordBySlug: vi.fn(),
	getEditorialProjectRecordBySlug: vi.fn(),
	getEditorialRecordForAdmin: () => getEditorialRecordForAdminMock(),
	listEditorialRecordsForAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: (path: string, type?: string) => revalidatePathMock(path, type),
}));

vi.mock("next/navigation", () => ({
	redirect: (path: string) => redirectMock(path),
}));

function buildEventFormData(overrides: Record<string, string | File | undefined> = {}) {
	const formData = new FormData();

	for (const [key, value] of Object.entries({
		currentSlug: "sarau-antigo",
		title: "Sarau antigo",
		slug: "sarau-antigo",
		summary: "Resumo legado",
		description: "Descrição com **Markdown** preservado",
		status: "Publicado",
		period: "Julho de 2026",
		location: "São Paulo",
		published: "true",
		order: "1",
		imageSrc: "https://cdn.example.com/evento-legado.jpg",
		imageAlt: "Foto legada",
		imageCaption: "Legenda legada",
		...overrides,
	})) {
		if (value !== undefined) {
			formData.set(key, value);
		}
	}

	return formData;
}

function buildSarauFormData(overrides: Record<string, string | File | undefined> = {}) {
	const formData = new FormData();

	for (const [key, value] of Object.entries({
		title: "Sarau Safado",
		summary: "Resumo",
		body: "Corpo",
		published: "true",
		order: "1",
		heroEyebrow: "Poesia",
		heroTitle: "Sarau",
		heroBody: "Texto",
		heroImageSrc: "https://cdn.example.com/sarau.jpg",
		heroImageAlt: "Hero",
		heroImageCaption: "Legenda",
		heroImageFit: "cover",
		heroImagePosition: "center",
		heroImageOverlay: "medium",
		heroImageContrast: "light",
		...overrides,
	})) {
		if (value !== undefined) formData.set(key, value);
	}

	return formData;
}

describe("editorial item image persistence", () => {
	beforeEach(() => {
		vi.resetModules();
		requireCapabilityMock.mockResolvedValue({ session: { sub: "admin-1", email: "admin@selo.test" } });
		getEditorialRecordForAdminMock.mockResolvedValue({
			type: "page_sarau",
			slug: "sarau-safado",
			title: "Sarau Safado",
			published: true,
			order: 1,
			hero: null,
		});
		updateOneMock.mockReset();
		updateOneMock.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
		getDbMock.mockResolvedValue({
			collection: () => ({
				updateOne: updateOneMock,
			}),
		});
		uploadImageFileToFastAPIMock.mockReset();
		redirectMock.mockClear();
		revalidatePathMock.mockClear();
	});

	it("preserves the existing image URL when saving text-only editorial changes", async () => {
		const { updateEditorialEventAction } = await import("./actions");

		await expect(
			updateEditorialEventAction(actionState, buildEventFormData({ title: "Sarau revisado" })),
		).rejects.toThrow("NEXT_REDIRECT:/admin/editorial/events/sarau-antigo");

		expect(uploadImageFileToFastAPIMock).not.toHaveBeenCalled();
		const update = updateOneMock.mock.calls[0]?.[1] as {
			$set: { image: unknown; description: string | null };
		};
		expect(update.$set.description).toBe("Descrição com **Markdown** preservado");
		expect(update.$set.image).toEqual({
			src: "https://cdn.example.com/evento-legado.jpg",
			alt: "Foto legada",
			caption: "Legenda legada",
		});
	});

	it("keeps the form data in place and returns a field error when a new event has no title", async () => {
		const { createEditorialEventAction } = await import("./actions");
		const result = await createEditorialEventAction(actionState, buildEventFormData({ title: "" }));

		expect(result).toEqual({
			status: "error",
			message: "Revise os campos destacados antes de salvar.",
			fieldErrors: { title: "Informe o título do evento." },
		});
		expect(updateOneMock).not.toHaveBeenCalled();
	});

	it("creates a new event and redirects to its editable record", async () => {
		const { createEditorialEventAction } = await import("./actions");

		await expect(
			createEditorialEventAction(
				actionState,
				buildEventFormData({ currentSlug: undefined, slug: undefined, title: "Novo Sarau" }),
			),
		).rejects.toThrow("NEXT_REDIRECT:/admin/editorial/events/");

		expect(updateOneMock).toHaveBeenCalledWith(
			{ type: "event", slug: "novo-sarau" },
			expect.objectContaining({ $set: expect.objectContaining({ title: "Novo Sarau" }) }),
			{ upsert: true },
		);
	});

	it("uploads a confirmed file on save and persists the returned public URL", async () => {
		const uploadedFile = new File(["nova-imagem"], "evento-novo.jpg", { type: "image/jpeg" });
		uploadImageFileToFastAPIMock.mockResolvedValue({
			secure_url: "https://res.cloudinary.com/selo/evento-novo.jpg",
		});
		const { updateEditorialEventAction } = await import("./actions");

		await expect(
			updateEditorialEventAction(actionState, buildEventFormData({ imageSrcFile: uploadedFile })),
		).rejects.toThrow("NEXT_REDIRECT:/admin/editorial/events/sarau-antigo");

		expect(uploadImageFileToFastAPIMock).toHaveBeenCalledWith(uploadedFile);
		const update = updateOneMock.mock.calls[0]?.[1] as { $set: { image: unknown } };
		expect(update.$set.image).toEqual({
			src: "https://res.cloudinary.com/selo/evento-novo.jpg",
			alt: "Foto legada",
			caption: "Legenda legada",
		});
	});

	it("rejects images above the editorial upload limit before calling the media API", async () => {
		const oversizedFile = new File([new Uint8Array(ADMIN_IMAGE_UPLOAD_MAX_BYTES + 1)], "evento-grande.jpg", {
			type: "image/jpeg",
		});
		const { updateEditorialEventAction } = await import("./actions");

		const result = await updateEditorialEventAction(
			actionState,
			buildEventFormData({ imageSrcFile: oversizedFile }),
		);

		expect(result).toEqual({
			status: "error",
			message: "A imagem deve ter no máximo 5 MB.",
			fieldErrors: {},
		});

		expect(uploadImageFileToFastAPIMock).not.toHaveBeenCalled();
		expect(updateOneMock).not.toHaveBeenCalled();
	});

	it("persists only allowed background options for Sarau hero", async () => {
		const { updateEditorialSarauAction } = await import("./actions");

		await expect(
			updateEditorialSarauAction(
				buildSarauFormData({
					heroImageFit: "url(javascript:alert(1))",
					heroImagePosition: "left top; color:red",
					heroImageOverlay: "linear-gradient(red, blue)",
					heroImageContrast: "expression(alert(1))",
				}),
			),
		).rejects.toThrow("NEXT_REDIRECT:/admin/editorial/sarau-safado");

		const update = updateOneMock.mock.calls[0]?.[1] as { $set: { hero: { background: unknown } } };
		expect(update.$set.hero.background).toEqual({
			image: {
				src: "https://cdn.example.com/sarau.jpg",
				alt: "Hero",
				caption: "Legenda",
			},
			fit: "cover",
			position: "center",
			overlay: "medium",
			contrast: "light",
		});
	});
});

function buildContactFormData(overrides: Record<string, string | undefined> = {}) {
	const formData = new FormData();

	for (const [key, value] of Object.entries({
		heroEyebrow: "Contato",
		heroTitle: "Fale com o selo",
		heroBody: "Texto editorial do contato",
		formTitle: "Escreva para o selo",
		formDescription: "Descrição do formulário",
		subject1: "Comprar livro",
		directTitle: "Canais diretos",
		directDescription: "Use os canais oficiais do selo.",
		direct1Label: "WhatsApp malicioso",
		direct1Text: "+55 11 00000-0000",
		direct1HrefPreset: "__custom__",
		direct1HrefCustom: "https://example.com/nao-usar",
		pathsTitle: "Caminhos comuns",
		pathsDescription: "Links editoriais internos.",
		path1Label: "Projetos",
		path1HrefPreset: "/projects",
		closingTitle: "Continue pelo selo",
		published: "true",
		...overrides,
	})) {
		if (value !== undefined) formData.set(key, value);
	}

	return formData;
}

describe("editorial contact fixed channels", () => {
	beforeEach(() => {
		vi.resetModules();
		requireCapabilityMock.mockResolvedValue({ session: { sub: "admin-1", email: "admin@selo.test" } });
		getEditorialRecordForAdminMock.mockResolvedValue({
			type: "page_contact",
			slug: "contact",
			title: "Contato",
			published: true,
			order: 1,
			hero: {
				featuredLabel: "Email",
				featuredValue: "contato-legado@selo.test",
			},
			direct: {
				title: "Canais diretos",
				description: "Descrição legada.",
				links: [
					{
						label: "Email",
						href: "mailto:contato-legado@selo.test",
						text: "contato-legado@selo.test",
					},
				],
			},
		});
		updateOneMock.mockReset();
		updateOneMock.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
		getDbMock.mockResolvedValue({
			collection: () => ({
				updateOne: updateOneMock,
			}),
		});
		redirectMock.mockClear();
		revalidatePathMock.mockClear();
	});

	it("preserves fixed contact links instead of accepting channel fields from admin form data", async () => {
		const { updateEditorialContactAction } = await import("./actions");

		await expect(updateEditorialContactAction(buildContactFormData())).rejects.toThrow(
			"NEXT_REDIRECT:/admin/editorial/contact",
		);

		const update = updateOneMock.mock.calls[0]?.[1] as {
			$set: {
				direct: { links: Array<{ label: string; href: string; text: string }> };
				hero: { featuredLabel: string | null; featuredValue: string | null };
			};
		};

		expect(update.$set.direct.links).toEqual([
			{
				label: "Email",
				href: "mailto:contato-legado@selo.test",
				text: "contato-legado@selo.test",
			},
		]);
		expect(update.$set.hero.featuredValue).toBe("contato-legado@selo.test");
	});
});
