"use client";

import { ImagePlus, RefreshCw, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";
import { Button } from "@/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/shadcn/dialog";

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
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [isDeletingImage, setIsDeletingImage] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);
	const [pendingPreviewUrls, setPendingPreviewUrls] = useState<string[]>([]);
	const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
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

	useEffect(() => {
		return () => {
			for (const previewUrl of pendingPreviewUrls) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [pendingPreviewUrls]);

	const handleFiles = (files: FileList | null) => {
		const nextFiles = isSingleImage ? toFileArray(files).slice(0, 1) : toFileArray(files);
		if (nextFiles.length === 0) {
			clearPendingSelection();
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
		setIsSelectionModalOpen(true);
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
		setSelectedImage(null);
		setIsDeleteConfirmOpen(false);
	};

	const uploadFile = async (file: File) => {
		const formData = new FormData();
		formData.set("file", file);

		const response = await fetch("/api/admin/media/upload", {
			method: "POST",
			body: formData,
		});
		const payload = (await response.json()) as { error?: string; url?: string };

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

		try {
			for (const file of nextFiles) {
				await uploadFile(file);
			}
			clearPendingSelection();
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
		if (uploadMode === "instant") {
			await uploadFiles(pendingFiles);
		}
	};

	const deleteSelectedImage = async () => {
		if (!selectedImage) return;

		setIsDeletingImage(true);
		setUploadError("");

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

			<div className="flex flex-col gap-3 rounded-md border border-dashed p-3 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<p className="text-sm font-medium">Imagem</p>
					<p className="text-xs text-muted-foreground">
						{uploadMode === "on-submit"
							? "Escolha, revise a prévia local e salve o formulário para publicar a troca."
							: isSingleImage
								? "Escolha uma imagem do computador."
								: "Escolha uma ou mais imagens do computador."}
					</p>
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
						className={[
							"inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground",
							isUploading ? "pointer-events-none opacity-50" : "",
						].join(" ")}
					>
						{isSingleImage && previewValues.length > 0 ? (
							<RefreshCw className="h-4 w-4" />
						) : (
							<ImagePlus className="h-4 w-4" />
						)}
						{isUploading ? "Enviando..." : isSingleImage ? pickerLabel : "Selecionar imagens"}
					</label>

					{uploadMode === "instant" && pendingFiles.length > 0 && !isUploading ? (
						<Button type="button" variant="outline" onClick={() => void uploadFiles(pendingFiles)}>
							Enviar agora
						</Button>
					) : null}
				</div>
			</div>

			{hasPendingSelection ? (
				<div className="flex flex-col gap-3 border border-amber-300 bg-amber-50 px-3 py-3 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<p className="font-medium">
							{uploadMode === "on-submit"
								? "Troca pendente: a imagem será enviada ao salvar."
								: "Imagem selecionada aguardando envio."}
						</p>
						<p>{pendingFiles.map((file) => file.name).join(", ")}</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={clearPendingSelection}
						disabled={isUploading}
					>
						<X className="mr-2 h-4 w-4" />
						Descartar troca
					</Button>
				</div>
			) : null}

			{uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{displayedPreviewValues.length ? (
					displayedPreviewValues.map((src, index) => (
						<button
							key={`${src}-${index}`}
							type="button"
							className="relative overflow-hidden rounded-md border bg-muted text-left"
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
					<div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground">
						Sem imagem disponível
					</div>
				) : null}

				{pendingPreviewUrls.map((src, index) => (
					<div
						key={`${src}-${index}`}
						className="relative overflow-hidden rounded-md border border-dashed border-primary/40 bg-muted/60"
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
							<div className="overflow-hidden rounded-lg border bg-muted/40">
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
						<div className="space-y-1 text-sm text-muted-foreground">
							<p>{pendingFiles[0]?.name ?? "Arquivo sem nome"}</p>
							{pendingFiles.length > 1 ? (
								<p>{pendingFiles.length} arquivos serão processados neste envio.</p>
							) : null}
							{uploadMode === "on-submit" ? (
								<p>A imagem será enviada somente ao salvar o formulário.</p>
							) : null}
						</div>
						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsSelectionModalOpen(false);
									clearPendingSelection();
								}}
								disabled={isUploading}
							>
								Descartar prévia
							</Button>
							<Button type="button" onClick={() => void confirmPendingSelection()} disabled={isUploading}>
								{isUploading
									? "Enviando..."
									: uploadMode === "on-submit"
										? "Confirmar troca"
										: "Salvar e enviar"}
							</Button>
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
							<div className="overflow-hidden rounded-lg bg-background">
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
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setSelectedImage(null);
										setIsDeleteConfirmOpen(false);
									}}
									disabled={isDeletingImage}
								>
									Fechar prévia
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={removeSelectedImageFromForm}
									disabled={isDeletingImage}
								>
									<X className="mr-2 h-4 w-4" />
									Remover do formulário
								</Button>
								<Button
									type="button"
									variant="destructive"
									onClick={() => setIsDeleteConfirmOpen(true)}
									disabled={isDeletingImage}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Excluir mídia
								</Button>
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
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsDeleteConfirmOpen(false)}
							disabled={isDeletingImage}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={() => void deleteSelectedImage()}
							disabled={isDeletingImage}
						>
							{isDeletingImage ? "Excluindo..." : "Sim, excluir"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
