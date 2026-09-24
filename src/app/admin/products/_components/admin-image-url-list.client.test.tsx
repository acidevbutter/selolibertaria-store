import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ImgHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_IMAGE_UPLOAD_MAX_BYTES } from "@/lib/admin-image-upload";
import { AdminImageUrlList } from "./admin-image-url-list.client";

vi.mock("next/image", () => ({
	default: ({
		src,
		alt,
		unoptimized: _unoptimized,
		priority: _priority,
		...props
	}: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; unoptimized?: boolean }) => (
		<img src={String(src)} alt={alt ?? ""} {...props} />
	),
}));

vi.mock("@/ui/shadcn/dialog", () => ({
	Dialog: ({ open, children }: { open?: boolean; children: ReactNode }) =>
		open ? <div>{children}</div> : null,
	DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
	DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

describe("AdminImageUrlList editorial on-submit flow", () => {
	const createObjectURL = vi.fn((file: File) => `blob:${file.name}`);
	const revokeObjectURL = vi.fn();
	const fetchMock = vi.fn();

	beforeEach(() => {
		createObjectURL.mockClear();
		revokeObjectURL.mockClear();
		fetchMock.mockClear();
		vi.spyOn(URL, "createObjectURL").mockImplementation(createObjectURL);
		vi.spyOn(URL, "revokeObjectURL").mockImplementation(revokeObjectURL);
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("keeps a confirmed local image preview pending without uploading immediately", async () => {
		render(
			<form>
				<AdminImageUrlList name="sectionImageSrc" uploadMode="on-submit" maxItems={1} />
				<button type="submit">Salvar formulário</button>
			</form>,
		);

		const file = new File(["conteudo-da-imagem"], "nova-capa.png", { type: "image/png" });

		fireEvent.change(screen.getByLabelText("Selecionar imagem"), {
			target: { files: [file] },
		});
		fireEvent.click(await screen.findByRole("button", { name: "Confirmar troca" }));

		expect(screen.queryByRole("button", { name: "Enviar agora" })).not.toBeInTheDocument();
		await waitFor(() => expect(screen.getByText("Prévia local.")).toBeInTheDocument());
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("blocks images above the editorial upload limit before preview", async () => {
		render(
			<form>
				<AdminImageUrlList name="sectionImageSrc" uploadMode="on-submit" maxItems={1} />
			</form>,
		);

		const file = new File([new Uint8Array(ADMIN_IMAGE_UPLOAD_MAX_BYTES + 1)], "capa-grande.jpg", {
			type: "image/jpeg",
		});

		fireEvent.change(screen.getByLabelText("Selecionar imagem"), {
			target: { files: [file] },
		});

		expect(await screen.findByText("A imagem deve ter no máximo 5 MB.")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Confirmar troca" })).not.toBeInTheDocument();
		expect(createObjectURL).not.toHaveBeenCalled();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("discards a pending local image before submit and keeps the previous persisted URL", async () => {
		const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const formData = new FormData(event.currentTarget);
			return formData;
		});

		render(
			<form onSubmit={onSubmit}>
				<AdminImageUrlList
					name="heroImageSrc"
					initialValues={["https://cdn.example.com/hero-antigo.jpg"]}
					uploadMode="on-submit"
					maxItems={1}
				/>
				<button type="submit">Salvar formulário</button>
			</form>,
		);

		const file = new File(["imagem-descartada"], "rascunho.jpg", { type: "image/jpeg" });

		fireEvent.change(screen.getByLabelText("Substituir imagem"), {
			target: { files: [file] },
		});
		fireEvent.click(await screen.findByRole("button", { name: "Confirmar troca" }));
		await waitFor(() => expect(screen.getByRole("button", { name: "Descartar troca" })).toBeInTheDocument());
		fireEvent.click(screen.getByRole("button", { name: "Descartar troca" }));
		fireEvent.click(screen.getByRole("button", { name: "Salvar formulário" }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		const submittedForm = onSubmit.mock.results[0]?.value as FormData;
		expect(submittedForm.get("heroImageSrc")).toBe("https://cdn.example.com/hero-antigo.jpg");
		expect(submittedForm.get("heroImageSrcFile")).toBeInstanceOf(File);
		expect((submittedForm.get("heroImageSrcFile") as File).size).toBe(0);
	});

	it("confirms a successful immediate upload and surfaces a readable failure", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ url: "https://res.cloudinary.com/selo/nova-capa.jpg" }),
		});

		render(<AdminImageUrlList name="images" />);
		const successFile = new File(["imagem"], "nova-capa.jpg", { type: "image/jpeg" });

		fireEvent.change(screen.getByLabelText("Selecionar imagens"), {
			target: { files: [successFile] },
		});
		fireEvent.change(await screen.findByLabelText("Descrição da imagem"), {
			target: { value: "Nova capa do livro" },
		});
		fireEvent.click(await screen.findByRole("button", { name: "Salvar e enviar" }));
		await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Imagem enviada com sucesso."));

		fetchMock.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: "A imagem não pôde ser processada." }),
		});
		const failedFile = new File(["imagem"], "falhou.jpg", { type: "image/jpeg" });
		fireEvent.change(screen.getByLabelText("Selecionar imagens"), {
			target: { files: [failedFile] },
		});
		fireEvent.change(await screen.findByLabelText("Descrição da imagem"), {
			target: { value: "Tentativa que falha" },
		});
		fireEvent.click(await screen.findByRole("button", { name: "Salvar e enviar" }));
		await waitFor(() =>
			expect(screen.getByRole("alert")).toHaveTextContent("A imagem não pôde ser processada."),
		);
	});

	it("submits the newly uploaded URL, not the stale pre-upload value, on instant upload", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ url: "https://res.cloudinary.com/selo/nova-capa.jpg" }),
		});

		const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			return new FormData(event.currentTarget);
		});

		render(
			<form onSubmit={onSubmit}>
				<AdminImageUrlList
					name="images"
					initialValues={["https://cdn.example.com/capa-antiga.jpg"]}
					autoSubmitOnUpload
					maxItems={1}
				/>
			</form>,
		);

		const file = new File(["imagem"], "nova-capa.jpg", { type: "image/jpeg" });
		fireEvent.change(screen.getByLabelText("Substituir imagem"), {
			target: { files: [file] },
		});
		fireEvent.change(await screen.findByLabelText("Descrição da imagem"), {
			target: { value: "Nova capa do livro" },
		});
		fireEvent.click(await screen.findByRole("button", { name: "Salvar e enviar" }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		const submittedForm = onSubmit.mock.results[0]?.value as FormData;
		expect(submittedForm.get("images")).toBe("https://res.cloudinary.com/selo/nova-capa.jpg");
	});
});
