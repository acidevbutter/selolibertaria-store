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
			<div className="ad-empty">
				<ImageOff className="h-6 w-6" style={{ color: "var(--ad-text-soft)" }} />
				<p style={{ fontSize: 14, fontWeight: 900 }}>Nenhuma imagem ainda — arraste a primeira.</p>
				<p style={{ maxWidth: 480, fontSize: 13, lineHeight: 1.6, color: "var(--ad-text-muted)" }}>
					Envie uma imagem pelo editorial ou por um produto. Ela passa a aparecer nesta biblioteca
					automaticamente.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
				{items.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => setSelected(item)}
						className="ad-panel"
						style={{ textAlign: "left", padding: 0 }}
					>
						<div
							className="relative aspect-square overflow-hidden"
							style={{ borderBottom: "1px solid var(--ad-line)", background: "var(--ad-sand)" }}
						>
							<NextImage
								src={item.url}
								alt={item.alt || item.filename}
								fill
								sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw"
								className="object-cover"
								{...getProductImageOptimizationProps(item.url)}
							/>
						</div>
						<div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
							<p className="truncate" style={{ fontSize: 12, fontWeight: 900 }} title={item.filename}>
								{item.filename}
							</p>
							<p className="ad-mono" style={{ fontSize: 11, color: "var(--ad-text-soft)" }}>
								{item.width && item.height ? `${item.width}×${item.height} · ` : ""}
								{formatBytes(item.bytes)}
							</p>
							<p className="ad-mono" style={{ fontSize: 11, color: "var(--ad-text-soft)" }}>
								{item.createdAtLabel}
							</p>
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
