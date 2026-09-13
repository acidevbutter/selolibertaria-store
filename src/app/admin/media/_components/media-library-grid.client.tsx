"use client";

import { ImageOff } from "lucide-react";
import NextImage from "next/image";
import { useState } from "react";
import { MediaCropEditor } from "@/app/admin/media/_components/media-crop-editor.client";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";

export type MediaLibraryItem = {
	id: string;
	url: string;
	filename: string;
	alt: string;
	bytes: number;
	width: number | null;
	height: number | null;
	createdAtLabel: string;
};

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryGrid({ items }: { items: MediaLibraryItem[] }) {
	const [selected, setSelected] = useState<MediaLibraryItem | null>(null);

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 border border-dashed border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-6 py-12 text-center">
				<ImageOff className="h-6 w-6 text-[var(--sl-text-muted)]" />
				<p className="text-sm font-semibold text-[var(--sl-ink)]">
					Nenhuma imagem ainda — arraste a primeira.
				</p>
				<p className="max-w-md text-sm leading-6 text-[var(--sl-text-muted)]">
					Envie uma imagem pelo editorial ou por um produto. Ela passa a aparecer nesta biblioteca
					automaticamente.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
				{items.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => setSelected(item)}
						className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] text-left"
						style={{ borderRadius: "var(--sl-radius)" }}
					>
						<div className="relative aspect-square overflow-hidden border-b border-[var(--sl-line)] bg-[var(--sl-surface-quiet)]">
							<NextImage
								src={item.url}
								alt={item.alt || item.filename}
								fill
								sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw"
								className="object-cover"
								{...getProductImageOptimizationProps(item.url)}
							/>
						</div>
						<div className="space-y-1 p-3">
							<p className="truncate text-xs font-semibold text-[var(--sl-ink)]" title={item.filename}>
								{item.filename}
							</p>
							<p className="text-[11px] text-[var(--sl-text-muted)]">
								{item.width && item.height ? `${item.width}×${item.height} · ` : ""}
								{formatBytes(item.bytes)}
							</p>
							<p className="text-[11px] text-[var(--sl-text-muted)]">{item.createdAtLabel}</p>
						</div>
					</button>
				))}
			</div>

			{selected ? (
				<MediaCropEditor assetId={selected.id} assetUrl={selected.url} onClose={() => setSelected(null)} />
			) : null}
		</>
	);
}
