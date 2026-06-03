"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";
import { Button } from "@/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/shadcn/dialog";

export function AdminImageUrlList({
	name = "images",
	initialValues = [],
	autoSubmitOnUpload = false,
}: {
	name?: string;
	initialValues?: string[];
	autoSubmitOnUpload?: boolean;
}) {
	const [values, setValues] = useState<string[]>(initialValues.length > 0 ? initialValues : [""]);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState("");
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const previewValues = values.map((value) => value.trim()).filter(Boolean);

	const appendValue = (nextValue: string) => {
		setValues((current) => {
			const emptyIndex = current.findIndex((item) => item.trim() === "");
			if (emptyIndex >= 0) {
				return current.map((item, itemIndex) => (itemIndex === emptyIndex ? nextValue : item));
			}

			return [...current, nextValue];
		});
	};

	const removeValue = (index: number) => {
		setValues((current) => {
			const nextValues = current.filter((_, itemIndex) => itemIndex !== index);
			return nextValues.length > 0 ? nextValues : [""];
		});
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
			throw new Error(payload.error || "Could not upload the image.");
		}

		appendValue(payload.url);
	};

	const uploadFiles = async (files: FileList) => {
		setIsUploading(true);
		setUploadError("");

		try {
			for (const file of Array.from(files)) {
				await uploadFile(file);
			}

			if (autoSubmitOnUpload) {
				containerRef.current?.closest("form")?.requestSubmit();
			}
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : "Could not upload the image.");
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	return (
		<div ref={containerRef} className="space-y-3">
			{previewValues.map((value, index) => (
				<input key={`${name}-hidden-${index}`} type="hidden" name={name} value={value} />
			))}
			<div className="flex flex-col gap-3 rounded-md border border-dashed p-3 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<p className="text-sm font-medium">Upload de imagem</p>
					<p className="text-xs text-muted-foreground">Escolha uma ou mais imagens do computador.</p>
				</div>
				<div className="flex items-center gap-2">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						multiple
						className="hidden"
						onChange={(event) => {
							const files = event.target.files;
							if (files?.length) {
								void uploadFiles(files);
							}
						}}
					/>
					<Button
						type="button"
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploading}
					>
						<ImagePlus className="h-4 w-4" />
						{isUploading ? "Uploading..." : "Select images"}
					</Button>
				</div>
			</div>
			{uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{previewValues.length ? (
					previewValues.map((src, index) => (
						<div
							key={`${src}-${index}`}
							className="group relative overflow-hidden rounded-md border bg-muted"
							role="button"
							tabIndex={0}
							onClick={() => setSelectedImage(src)}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									setSelectedImage(src);
								}
							}}
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
							<Button
								type="button"
								variant="secondary"
								size="icon"
								className="absolute right-2 top-2 opacity-100 shadow-sm sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
								onClick={(event) => {
									event.stopPropagation();
									removeValue(index);
								}}
								aria-label={`Remove image ${index + 1}`}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					))
				) : (
					<div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground">
						No image
					</div>
				)}
			</div>
			<Dialog
				open={Boolean(selectedImage)}
				onOpenChange={(open) => {
					if (!open) setSelectedImage(null);
				}}
			>
				<DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
					<DialogHeader className="sr-only">
						<DialogTitle>Image preview</DialogTitle>
						<DialogDescription>Expanded product image preview.</DialogDescription>
					</DialogHeader>
					{selectedImage ? (
						<div className="overflow-hidden rounded-lg bg-background">
							<Image
								src={selectedImage}
								alt="Expanded image"
								width={1600}
								height={1600}
								className="max-h-[85vh] w-full object-contain"
								sizes="90vw"
								{...getProductImageOptimizationProps(selectedImage)}
							/>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}
