"use client";

import { ImagePlus, RefreshCw, Trash2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import type { DragEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ADMIN_IMAGE_UPLOAD_MAX_LABEL, getAdminImageUploadError } from "@/lib/admin-image-upload";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/shadcn/dialog";
import { SlButton } from "@/ui/sl/sl-button";

const radiusStyle = { borderRadius: "var(--sl-radius)" } as const;

export function AdminImageUrlList({
	name = "images",
	initialValues = [],
	autoSubmitOnUpload = false,
	uploadMode = "instant",
	maxItems,
}: {
	name?: string;
	initialValues?: string[];
	autoSubmitOnUpload?: boolean;
	uploadMode?: "instant" | "on-submit";
	maxItems?: number;
}) {
	const normalizedInitialValues = maxItems && maxItems > 0 ? initialValues.slice(0, maxItems) : initialValues;
	const [values, setValues] = useState<string[]>(
		normalizedInitialValues.length > 0 ? normalizedInitialValues : [""],
	);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState("");
	const [uploadSuccess, setUploadSuccess] = useState("");
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [isDeletingImage, setIsDeletingImage] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);
	const [pendingPreviewUrls, setPendingPreviewUrls] = useState<string[]>([]);
	const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
	const [pendingAlt, setPendingAlt] = useState("");
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const dragDepthRef = useRef(0);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const preservePendingSelectionRef = useRef(false);
	const inputId = `${name}-file-input`;
	const previewValues = values.map((value) => value.trim()).filter(Boolean);
	const isSingleImage = maxItems === 1;
	const hasPendingSelection = pendingFiles.length > 0;
	const displayedPreviewValues = isSingleImage && hasPendingSelection ? [] : previewValues;
	const pickerLabel = isSingleImage && previewValues.length > 0 ? "Substituir imagem" : "Selecionar imagem";

	const toFileArray = (value: File[] | FileList | Event | null | undefined) => {
		if (!value) return [];
		if (value instanceof FileList) return Array.from(value);
		if (Array.isArray(value)) return value.filter((item): item is File => item instanceof File);
		return [];
	};

	const clearPendingSelection = () => {
		preservePendingSelectionRef.current = false;
		setPendingFiles([]);
		setPendingAlt("");
		setPendingPreviewUrls((current) => {
			for (const previewUrl of current) {
				URL.revokeObjectURL(previewUrl);
			}
			return [];
		});
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const emitDraftMedia = (src: string | null) => {
		const formId = containerRef.current?.closest("form")?.id;
		if (!formId) return;
		window.dispatchEvent(new CustomEvent("editorial-draft-media", { detail: { formId, name, src } }));
	};

	const resetToInitialValues = () => {
		clearPendingSelection();
		setValues(normalizedInitialValues.length > 0 ? normalizedInitialValues : [""]);
		emitDraftMedia(null);
	};

	useEffect(() => {
		return () => {
			for (const previewUrl of pendingPreviewUrls) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [pendingPreviewUrls]);

	useEffect(() => {
		const discardDraft = (event: Event) => {
			const detail = (event as CustomEvent<{ formId: string }>).detail;
			if (containerRef.current?.closest("form")?.id !== detail.formId) return;
			resetToInitialValues();
		};

		window.addEventListener("editorial-draft-discard", discardDraft);
		return () => window.removeEventListener("editorial-draft-discard", discardDraft);
	}, [normalizedInitialValues]);

	const handleFiles = (files: FileList | null) => {
		const nextFiles = isSingleImage ? toFileArray(files).slice(0, 1) : toFileArray(files);
		if (nextFiles.length === 0) {
			clearPendingSelection();
			return;
		}

		const invalidFileMessage = nextFiles.map(getAdminImageUploadError).find(Boolean);
		if (invalidFileMessage) {
			clearPendingSelection();
			setUploadError(invalidFileMessage);
			return;
		}

		setPendingPreviewUrls((current) => {
			for (const previewUrl of current) {
				URL.revokeObjectURL(previewUrl);
			}
			return nextFiles.map((file) => URL.createObjectURL(file));
		});
		preservePendingSelectionRef.current = false;
		setPendingFiles(nextFiles);
		setUploadError("");
		setUploadSuccess("");
		setIsSelectionModalOpen(true);
	};

	const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		if (!event.dataTransfer.types.includes("Files")) return;
		dragDepthRef.current += 1;
		setIsDraggingOver(true);
	};

	const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);
		if (dragDepthRef.current === 0) setIsDraggingOver(false);
	};

	const handleDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		dragDepthRef.current = 0;
		setIsDraggingOver(false);
		if (isUploading) return;
		handleFiles(event.dataTransfer.files);
	};

	const appendValue = (nextValue: string) => {
		setValues((current) => {
			if (isSingleImage) {
				return [nextValue];
			}

			const emptyIndex = current.findIndex((item) => item.trim() === "");
			if (emptyIndex >= 0) {
				return current.map((item, itemIndex) => (itemIndex === emptyIndex ? nextValue : item));
			}

			const appendedValues = [...current, nextValue];
			return maxItems && maxItems > 0 ? appendedValues.slice(0, maxItems) : appendedValues;
		});
	};

	const removeValueByUrl = (imageUrl: string) => {
		setValues((current) => {
			const nextValues = current.filter((item) => item.trim() !== imageUrl.trim());
			return nextValues.length > 0 ? nextValues : [""];
		});
	};

	const removeSelectedImageFromForm = () => {
		if (!selectedImage) return;
		removeValueByUrl(selectedImage);
		emitDraftMedia(null);
		setSelectedImage(null);
		setIsDeleteConfirmOpen(false);
	};

	const uploadFile = async (file: File) => {
		const formData = new FormData();
		formData.set("file", file);
		if (pendingAlt.trim()) formData.set("alt", pendingAlt.trim());
		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 45_000);
		let response: Response;

		try {
			response = await fetch("/api/admin/media/upload", {
				method: "POST",
				body: formData,
				signal: controller.signal,
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				throw new Error("O envio da imagem demorou demais. Verifique a conexão e tente novamente.");
			}
			throw error;
		} finally {
			window.clearTimeout(timeout);
		}

		const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string };

		if (!response.ok || !payload.url) {
			throw new Error(payload.error || "Não foi possível enviar a imagem.");
		}

		appendValue(payload.url);
	};

	const uploadFiles = async (files: File[] | FileList | Event | null | undefined) => {
		const nextFiles = toFileArray(files);
		if (nextFiles.length === 0) {
			setUploadError("Nenhum arquivo de imagem foi selecionado.");
			return;
		}

		setIsUploading(true);
		setUploadError("");
		setUploadSuccess("");

		try {
			for (const file of nextFiles) {
				await uploadFile(file);
			}
			clearPendingSelection();
			setUploadSuccess(
				nextFiles.length === 1 ? "Imagem enviada com sucesso." : "Imagens enviadas com sucesso.",
			);
			if (autoSubmitOnUpload) {
				containerRef.current?.closest("form")?.requestSubmit();
			}
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : "Não foi possível enviar imagem.");
		} finally {
			setIsUploading(false);
		}
	};

	const confirmPendingSelection = async () => {
		if (pendingFiles.length === 0) {
			setIsSelectionModalOpen(false);
			return;
		}

		preservePendingSelectionRef.current = true;
		setIsSelectionModalOpen(false);
		emitDraftMedia(pendingPreviewUrls[0] ?? null);
		if (uploadMode === "instant") {
			await uploadFiles(pendingFiles);
		} else {
			setUploadSuccess("Imagem confirmada. Ela será enviada ao salvar o formulário.");
		}
	};

	const deleteSelectedImage = async () => {
		if (!selectedImage) return;

		setIsDeletingImage(true);
		setUploadError("");
		setUploadSuccess("");

		try {
			const response = await fetch("/api/admin/media/delete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url: selectedImage }),
			});
			const payload = (await response.json()) as { error?: string };
			if (!response.ok) {
				throw new Error(payload.error || "Não foi possível excluir imagem.");
			}

			removeValueByUrl(selectedImage);
			setSelectedImage(null);
			setIsDeleteConfirmOpen(false);
			setUploadSuccess("Imagem excluída com sucesso.");
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : "Não foi possível excluir imagem.");
		} finally {
			setIsDeletingImage(false);
		}
	};

	return (
		<div ref={containerRef} className="space-y-3">
			{previewValues.map((value, index) => (
				<input key={`${name}-hidden-${index}`} type="hidden" name={name} value={value} />
			))}

			<div
				onDragEnter={handleDragEnter}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={cn(
					"flex flex-col gap-3 border border-dashed p-4 transition-colors md:flex-row md:items-center md:justify-between",
					isDraggingOver
						? "border-[var(--sl-wine)] bg-[var(--sl-danger-wash)]"
						: "border-[var(--sl-line)] bg-[var(--sl-paper-pure)]",
				)}
				style={radiusStyle}
			>
				<div className="flex items-center gap-3">
					<UploadCloud
						className={cn(
							"h-5 w-5 shrink-0",
							isDraggingOver ? "text-[var(--sl-wine)]" : "text-[var(--sl-text-muted)]",
						)}
					/>
					<div className="space-y-1">
						<p className="text-sm font-medium text-[var(--sl-ink)]">
							{isDraggingOver ? "Solte para enviar" : "Arraste a foto aqui"}
						</p>
						<p className="text-xs text-[var(--sl-text-muted)]">
							{isDraggingOver
								? "JPG, PNG ou WebP."
								: uploadMode === "on-submit"
									? `ou escolha do computador. Limite: ${ADMIN_IMAGE_UPLOAD_MAX_LABEL}. Revise a prévia local e salve o formulário para publicar a troca.`
									: isSingleImage
										? `ou escolha do computador. Limite: ${ADMIN_IMAGE_UPLOAD_MAX_LABEL}.`
										: `ou escolha do computador. Limite: ${ADMIN_IMAGE_UPLOAD_MAX_LABEL}.`}
						</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<input
						id={inputId}
						name={`${name}File`}
						ref={fileInputRef}
						type="file"
						accept="image/*"
						multiple={!isSingleImage}
						className="sr-only"
						onClick={(event) => {
							event.currentTarget.value = "";
						}}
						onInput={(event) => {
							handleFiles(event.currentTarget.files);
						}}
						onChange={(event) => {
							handleFiles(event.currentTarget.files);
						}}
					/>
					<label
						htmlFor={inputId}
						className={cn(
							"sl-btn sl-btn-secondary gap-2",
							isUploading ? "pointer-events-none opacity-50" : "",
						)}
						style={{ height: "var(--sl-h-small)", padding: "0 16px", fontSize: "11px" }}
					>
						{isSingleImage && previewValues.length > 0 ? (
							<RefreshCw className="h-4 w-4" />
						) : (
							<ImagePlus className="h-4 w-4" />
						)}
						{isUploading ? "Enviando..." : isSingleImage ? pickerLabel : "Selecionar imagens"}
					</label>

					{uploadMode === "instant" && pendingFiles.length > 0 && !isUploading ? (
						<SlButton
							type="button"
							variant="secondary"
							size="sm"
							onClick={() => void uploadFiles(pendingFiles)}
						>
							Enviar agora
						</SlButton>
					) : null}
				</div>
			</div>

			{isUploading ? (
				<div
					className="flex items-center gap-3 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-3 py-3 text-xs text-[var(--sl-text-muted)]"
					style={radiusStyle}
				>
					{pendingPreviewUrls[0] ? (
						<Image
							src={pendingPreviewUrls[0]}
							alt="Prévia da imagem em envio"
							width={40}
							height={40}
							className="h-10 w-10 shrink-0 object-cover"
							style={radiusStyle}
							unoptimized
						/>
					) : null}
					<span>Enviando imagem...</span>
				</div>
			) : null}

			{hasPendingSelection ? (
				<div
					className="flex flex-col gap-3 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-3 py-3 text-xs text-[var(--sl-text)] sm:flex-row sm:items-center sm:justify-between"
					style={radiusStyle}
				>
					<div className="space-y-1">
						<p className="font-medium text-[var(--sl-ink)]">
							{uploadMode === "on-submit"
								? "Troca pendente: a imagem será enviada ao salvar."
								: "Imagem selecionada aguardando envio."}
						</p>
						<p>{pendingFiles.map((file) => file.name).join(", ")}</p>
					</div>
					<SlButton
						type="button"
						variant="secondary"
						size="sm"
						onClick={clearPendingSelection}
						disabled={isUploading}
					>
						<X className="mr-2 h-4 w-4" />
						Descartar troca
					</SlButton>
				</div>
			) : null}

			{uploadError ? (
				<div
					className="border border-[var(--sl-danger-line)] bg-[var(--sl-danger-wash)] px-3 py-3"
					style={radiusStyle}
				>
					<p role="alert" className="text-sm text-[var(--sl-danger)]">
						{uploadError}
					</p>
				</div>
			) : null}
			{uploadSuccess ? (
				<p role="status" className="text-sm text-[var(--sl-ink)]">
					{uploadSuccess}
				</p>
			) : null}

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{displayedPreviewValues.length ? (
					displayedPreviewValues.map((src, index) => (
						<button
							key={`${src}-${index}`}
							type="button"
							className="relative overflow-hidden border border-[var(--sl-line)] bg-[var(--sl-surface-quiet)] text-left"
							style={radiusStyle}
							aria-label={`Visualizar imagem ${index + 1}`}
							onClick={() => setSelectedImage(src)}
						>
							<Image
								src={src}
								alt={`Imagem ${index + 1}`}
								width={320}
								height={320}
								className="aspect-square h-full w-full object-cover"
								sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
								{...getProductImageOptimizationProps(src)}
							/>
						</button>
					))
				) : pendingPreviewUrls.length === 0 ? (
					<div
						className="flex aspect-square w-full items-center justify-center border border-dashed border-[var(--sl-line)] bg-[var(--sl-surface-quiet)] text-sm text-[var(--sl-text-muted)]"
						style={radiusStyle}
					>
						Sem imagem disponível
					</div>
				) : null}

				{pendingPreviewUrls.map((src, index) => (
					<div
						key={`${src}-${index}`}
						className="relative overflow-hidden border border-dashed border-[var(--sl-wine)] bg-[var(--sl-surface-quiet)]"
						style={radiusStyle}
					>
						<Image
							src={src}
							alt={`Prévia ${index + 1}`}
							width={320}
							height={320}
							className="aspect-square h-full w-full object-cover opacity-80"
							sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
							unoptimized
						/>
						<div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-xs text-white">
							Prévia local.
						</div>
					</div>
				))}
			</div>

			<Dialog
				open={isSelectionModalOpen}
				onOpenChange={(open) => {
					setIsSelectionModalOpen(open);
					if (!open && !isUploading && !preservePendingSelectionRef.current) {
						clearPendingSelection();
					}
					if (open) {
						preservePendingSelectionRef.current = false;
					}
				}}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Revisar imagem selecionada</DialogTitle>
						<DialogDescription>Confira a prévia local antes de confirmar a troca.</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{pendingPreviewUrls[0] ? (
							<div
								className="overflow-hidden border border-[var(--sl-line)] bg-[var(--sl-surface-quiet)]"
								style={radiusStyle}
							>
								<Image
									src={pendingPreviewUrls[0]}
									alt={pendingFiles[0]?.name || "Prévia da imagem selecionada"}
									width={1200}
									height={1200}
									className="max-h-[65vh] w-full object-contain"
									sizes="90vw"
									unoptimized
								/>
							</div>
						) : null}
						<div className="space-y-1 text-sm text-[var(--sl-text-muted)]">
							<p>{pendingFiles[0]?.name ?? "Arquivo sem nome"}</p>
							{pendingFiles.length > 1 ? (
								<p>{pendingFiles.length} arquivos serão processados neste envio.</p>
							) : null}
							{uploadMode === "on-submit" ? (
								<p>A imagem será enviada somente ao salvar o formulário.</p>
							) : null}
						</div>
						<div className="space-y-2">
							<label
								htmlFor={`${inputId}-alt`}
								className="text-[11px] uppercase tracking-[0.2em] text-[var(--sl-text-muted)]"
							>
								Descrição da imagem
							</label>
							<input
								id={`${inputId}-alt`}
								value={pendingAlt}
								onChange={(event) => setPendingAlt(event.target.value)}
								placeholder="O que essa imagem mostra?"
								className="h-[var(--sl-h-button)] w-full border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-4 text-sm text-[var(--sl-ink)] outline-none placeholder:text-[color:var(--sl-text-disabled)]"
								style={radiusStyle}
							/>
							<p className="text-xs text-[var(--sl-text-muted)]">
								Obrigatória para leitoras de tela e para habilitar o envio.
							</p>
						</div>
						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<SlButton
								type="button"
								variant="secondary"
								onClick={() => {
									setIsSelectionModalOpen(false);
									clearPendingSelection();
								}}
								disabled={isUploading}
							>
								Descartar prévia
							</SlButton>
							<SlButton
								type="button"
								variant="primary"
								onClick={() => void confirmPendingSelection()}
								disabled={isUploading || !pendingAlt.trim()}
							>
								{isUploading
									? "Enviando..."
									: uploadMode === "on-submit"
										? "Confirmar troca"
										: "Salvar e enviar"}
							</SlButton>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={Boolean(selectedImage)}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedImage(null);
						setIsDeleteConfirmOpen(false);
					}
				}}
			>
				<DialogContent className="max-w-5xl">
					<DialogHeader>
						<DialogTitle>Prévia da imagem</DialogTitle>
						<DialogDescription>
							Revise a imagem atual, remova-a do formulário ou exclua a mídia enviada.
						</DialogDescription>
					</DialogHeader>
					{selectedImage ? (
						<div className="space-y-4">
							<div
								className="overflow-hidden border border-[var(--sl-line)] bg-[var(--sl-surface-quiet)]"
								style={radiusStyle}
							>
								<Image
									src={selectedImage}
									alt="Prévia ampliada da imagem"
									width={1600}
									height={1600}
									className="max-h-[75vh] w-full object-contain"
									sizes="90vw"
									{...getProductImageOptimizationProps(selectedImage)}
								/>
							</div>
							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
								<SlButton
									type="button"
									variant="secondary"
									onClick={() => {
										setSelectedImage(null);
										setIsDeleteConfirmOpen(false);
									}}
									disabled={isDeletingImage}
								>
									Fechar prévia
								</SlButton>
								<SlButton
									type="button"
									variant="secondary"
									onClick={removeSelectedImageFromForm}
									disabled={isDeletingImage}
								>
									<X className="mr-2 h-4 w-4" />
									Remover do formulário
								</SlButton>
								<SlButton
									type="button"
									variant="accent"
									onClick={() => setIsDeleteConfirmOpen(true)}
									disabled={isDeletingImage}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Excluir mídia
								</SlButton>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Excluir imagem?</DialogTitle>
						<DialogDescription>
							Tem certeza que quer excluir esta imagem? Essa ação remove a mídia do formulário e também da
							biblioteca de mídia.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<SlButton
							type="button"
							variant="secondary"
							onClick={() => setIsDeleteConfirmOpen(false)}
							disabled={isDeletingImage}
						>
							Cancelar
						</SlButton>
						<SlButton
							type="button"
							variant="accent"
							onClick={() => void deleteSelectedImage()}
							disabled={isDeletingImage}
						>
							{isDeletingImage ? "Excluindo..." : "Sim, excluir"}
						</SlButton>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
