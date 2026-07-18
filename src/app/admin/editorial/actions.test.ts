import { beforeEach, describe, expect, it, vi } from "vitest";

const requireCapabilityMock = vi.fn();
const getDbMock = vi.fn();
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

describe("editorial item image persistence", () => {
	beforeEach(() => {
		vi.resetModules();
		requireCapabilityMock.mockResolvedValue({ session: { sub: "admin-1", email: "admin@selo.test" } });
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
});
