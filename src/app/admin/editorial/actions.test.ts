import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_IMAGE_UPLOAD_MAX_BYTES } from "@/lib/admin-image-upload";

const requireCapabilityMock = vi.fn();
const getDbMock = vi.fn();
const getEditorialRecordForAdminMock = vi.fn();
const updateOneMock = vi.fn();
const uploadImageFileToCloudinaryMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
	throw new Error(`NEXT_REDIRECT:${path}`);
});
const revalidatePathMock = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("@/lib/api-auth", () => ({
	requireCapability: () => requireCapabilityMock(),
}));

vi.mock("@/lib/cloudinary-upload", () => ({
	uploadImageFileToCloudinary: (file: File) => uploadImageFileToCloudinaryMock(file),
}));

vi.mock("@/lib/mongodb", () => ({
	getDb: () => getDbMock(),
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
		uploadImageFileToCloudinaryMock.mockReset();
		redirectMock.mockClear();
		revalidatePathMock.mockClear();
	});

	it("preserves the existing image URL when saving text-only editorial changes", async () => {
		const { updateEditorialEventAction } = await import("./actions");

		await expect(updateEditorialEventAction(buildEventFormData({ title: "Sarau revisado" }))).rejects.toThrow(
			"NEXT_REDIRECT:/admin/editorial/events/sarau-antigo",
		);

		expect(uploadImageFileToCloudinaryMock).not.toHaveBeenCalled();
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

	it("uploads a confirmed file on save and persists the returned public URL", async () => {
		const uploadedFile = new File(["nova-imagem"], "evento-novo.jpg", { type: "image/jpeg" });
		uploadImageFileToCloudinaryMock.mockResolvedValue({
			secure_url: "https://res.cloudinary.com/selo/evento-novo.jpg",
		});
		const { updateEditorialEventAction } = await import("./actions");

		await expect(
			updateEditorialEventAction(buildEventFormData({ imageSrcFile: uploadedFile })),
		).rejects.toThrow("NEXT_REDIRECT:/admin/editorial/events/sarau-antigo");

		expect(uploadImageFileToCloudinaryMock).toHaveBeenCalledWith(uploadedFile);
		const update = updateOneMock.mock.calls[0]?.[1] as { $set: { image: unknown } };
		expect(update.$set.image).toEqual({
			src: "https://res.cloudinary.com/selo/evento-novo.jpg",
			alt: "Foto legada",
			caption: "Legenda legada",
		});
	});

	it("rejects images above the editorial upload limit before calling Cloudinary", async () => {
		const oversizedFile = new File([new Uint8Array(ADMIN_IMAGE_UPLOAD_MAX_BYTES + 1)], "evento-grande.jpg", {
			type: "image/jpeg",
		});
		const { updateEditorialEventAction } = await import("./actions");

		await expect(
			updateEditorialEventAction(buildEventFormData({ imageSrcFile: oversizedFile })),
		).rejects.toThrow("A imagem deve ter no máximo 5 MB.");

		expect(uploadImageFileToCloudinaryMock).not.toHaveBeenCalled();
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
