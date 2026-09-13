"use client";

import Image from "next/image";
import { useState } from "react";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/shadcn/dialog";

const radiusStyle = { borderRadius: "var(--sl-radius)" } as const;

export function AdminProductImagePreview({
	images,
	alt,
	size = "md",
}: {
	images: string[];
	alt: string;
	size?: "sm" | "md";
}) {
	const [selectedImage, setSelectedImage] = useState<string | null>(null);

	if (!images.length) {
		return (
			<div
				className={
					size === "sm"
						? "flex h-14 w-14 items-center justify-center border border-dashed border-[var(--sl-line)] bg-[var(--sl-surface-quiet)] text-[11px] text-[var(--sl-text-muted)]"
						: "flex aspect-square w-full items-center justify-center border border-dashed border-[var(--sl-line)] bg-[var(--sl-surface-quiet)] text-sm text-[var(--sl-text-muted)]"
				}
				style={radiusStyle}
			>
				Sem imagem disponível
			</div>
		);
	}

	if (size === "sm") {
		return (
			<>
				<button
					type="button"
					className="h-14 w-14 overflow-hidden border border-[var(--sl-line)] bg-[var(--sl-surface-quiet)]"
					style={radiusStyle}
					onClick={() => setSelectedImage(images[0]!)}
				>
					<Image
						src={images[0]!}
						alt={alt}
						width={56}
						height={56}
						className="h-full w-full object-cover"
						sizes="56px"
						{...getProductImageOptimizationProps(images[0]!)}
					/>
				</button>
				<ImagePreviewDialog
					alt={alt}
					selectedImage={selectedImage}
					onOpenChange={(open) => {
						if (!open) setSelectedImage(null);
					}}
				/>
			</>
		);
	}

	return (
		<>
			<div className="space-y-3">
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{images.slice(0, 4).map((src, index) => (
						<button
							key={`${src}-${index}`}
							type="button"
							className="overflow-hidden border border-[var(--sl-line)] bg-[var(--sl-surface-quiet)] text-left"
							style={radiusStyle}
							onClick={() => setSelectedImage(src)}
						>
							<Image
								src={src}
								alt={`${alt} ${index + 1}`}
								width={320}
								height={320}
								className="aspect-square h-full w-full object-cover"
								sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
								{...getProductImageOptimizationProps(src)}
							/>
						</button>
					))}
				</div>
				{images.length > 4 ? (
					<p className="text-xs text-[var(--sl-text-muted)]">
						Mostrando 4 de {images.length} imagens desta galeria.
					</p>
				) : null}
			</div>
			<ImagePreviewDialog
				alt={alt}
				selectedImage={selectedImage}
				onOpenChange={(open) => {
					if (!open) setSelectedImage(null);
				}}
			/>
		</>
	);
}

function ImagePreviewDialog({
	alt,
	selectedImage,
	onOpenChange,
}: {
	alt: string;
	selectedImage: string | null;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Dialog open={Boolean(selectedImage)} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
				<DialogHeader className="sr-only">
					<DialogTitle>{alt}</DialogTitle>
					<DialogDescription>Prévia ampliada da imagem selecionada.</DialogDescription>
				</DialogHeader>
				{selectedImage ? (
					<div
						className="overflow-hidden border border-[var(--sl-line)] bg-[var(--sl-surface-quiet)]"
						style={radiusStyle}
					>
						<Image
							src={selectedImage}
							alt={alt}
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
	);
}
