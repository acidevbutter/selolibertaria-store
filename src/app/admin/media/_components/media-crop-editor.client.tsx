"use client";

import { FlipHorizontal, RotateCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/shadcn/dialog";
import { SlButton } from "@/ui/sl/sl-button";

const ASPECT_PRESETS = [
	{ key: "16:9", label: "Faixa do hero · 16:9", ratio: 16 / 9 },
	{ key: "3:4", label: "Capa · 3:4", ratio: 3 / 4 },
	{ key: "1:1", label: "Quadrada · 1:1", ratio: 1 },
	{ key: "free", label: "Livre", ratio: undefined },
] as const;

type AspectKey = (typeof ASPECT_PRESETS)[number]["key"];

type MediaCropDto = {
	aspect: string;
	x: number;
	y: number;
	w: number;
	h: number;
	rotate: number;
	flip: boolean;
	grayscale: boolean;
};

const radiusStyle = { borderRadius: "var(--sl-radius)" } as const;

function defaultCropForRatio(ratio: number | undefined): Crop {
	if (!ratio) return { unit: "%", x: 0, y: 0, width: 100, height: 100 };
	return centerCrop(makeAspectCrop({ unit: "%", width: 90 }, ratio, 100, 100), 100, 100);
}

export function MediaCropEditor({
	assetId,
	assetUrl,
	onClose,
}: {
	assetId: string;
	assetUrl: string;
	onClose: () => void;
}) {
	const [aspectKey, setAspectKey] = useState<AspectKey>("free");
	const [crops, setCrops] = useState<Record<string, MediaCropDto>>({});
	const [crop, setCrop] = useState<Crop>(defaultCropForRatio(undefined));
	const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
	const [flip, setFlip] = useState(false);
	const [grayscale, setGrayscale] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<string | null>(null);
	const [previewVersion, setPreviewVersion] = useState(0);

	const activePreset = ASPECT_PRESETS.find((preset) => preset.key === aspectKey) ?? ASPECT_PRESETS[3];

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const res = await fetch(`/api/admin/media/${assetId}/crops`, { cache: "no-store" });
				if (!res.ok) return;
				const data = (await res.json()) as MediaCropDto[];
				if (!mounted) return;
				const byAspect: Record<string, MediaCropDto> = {};
				for (const item of data) byAspect[item.aspect] = item;
				setCrops(byAspect);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [assetId]);

	useEffect(() => {
		const saved = crops[aspectKey];
		if (saved) {
			setCrop({ unit: "%", x: saved.x * 100, y: saved.y * 100, width: saved.w * 100, height: saved.h * 100 });
			setRotate(saved.rotate as 0 | 90 | 180 | 270);
			setFlip(saved.flip);
			setGrayscale(saved.grayscale);
		} else {
			setCrop(defaultCropForRatio(activePreset.ratio));
			setRotate(0);
			setFlip(false);
			setGrayscale(false);
		}
	}, [aspectKey, crops, activePreset.ratio]);

	const previewUrl = useMemo(
		() =>
			`/api/admin/media/${assetId}/render?aspect=${encodeURIComponent(aspectKey)}&width=400&v=${previewVersion}`,
		[assetId, aspectKey, previewVersion],
	);

	async function saveCrop() {
		setSaving(true);
		setStatus(null);
		try {
			const res = await fetch(`/api/admin/media/${assetId}/crops/${encodeURIComponent(aspectKey)}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					x: crop.x / 100,
					y: crop.y / 100,
					w: crop.width / 100,
					h: crop.height / 100,
					rotate,
					flip,
					grayscale,
				}),
			});
			const data = (await res.json().catch(() => null)) as (MediaCropDto & { error?: string }) | null;
			if (!res.ok) {
				setStatus(data?.error || "Não foi possível salvar o recorte.");
				return;
			}
			if (data) setCrops((current) => ({ ...current, [aspectKey]: data }));
			setPreviewVersion((value) => value + 1);
			setStatus("Recorte salvo.");
		} catch {
			setStatus("Não foi possível salvar o recorte.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-4xl">
				<DialogHeader>
					<DialogTitle>Recorte não destrutivo</DialogTitle>
					<DialogDescription>
						O arquivo original nunca é alterado. Cada proporção guarda seu próprio recorte.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-wrap gap-2">
					{ASPECT_PRESETS.map((preset) => (
						<button
							key={preset.key}
							type="button"
							onClick={() => setAspectKey(preset.key)}
							className={cn(
								"border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
								aspectKey === preset.key
									? "border-[var(--sl-ink)] bg-[var(--sl-ink)] text-[var(--sl-text-on-ink)]"
									: "border-[var(--sl-line)] bg-[var(--sl-paper-pure)] text-[var(--sl-text-muted)]",
							)}
							style={radiusStyle}
						>
							{preset.label}
						</button>
					))}
				</div>

				<div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
					<div
						className="flex items-center justify-center border border-[var(--sl-line)] bg-[var(--sl-surface-quiet)] p-3"
						style={radiusStyle}
					>
						{loading ? (
							<p className="p-8 text-sm text-[var(--sl-text-muted)]">Carregando...</p>
						) : (
							<ReactCrop
								crop={crop}
								onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
								aspect={activePreset.ratio}
								className="max-h-[60vh]"
							>
								<img src={assetUrl} alt="Imagem original para recorte" className="max-h-[60vh]" />
							</ReactCrop>
						)}
					</div>

					<div className="space-y-4">
						<div className="space-y-2">
							<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
								Ajustes
							</p>
							<div className="flex flex-wrap gap-2">
								<SlButton
									type="button"
									variant="secondary"
									size="sm"
									onClick={() => setRotate((current) => ((current + 90) % 360) as 0 | 90 | 180 | 270)}
								>
									<RotateCw className="h-4 w-4" />
									Girar 90°
								</SlButton>
								<SlButton
									type="button"
									variant={flip ? "primary" : "secondary"}
									size="sm"
									onClick={() => setFlip((value) => !value)}
								>
									<FlipHorizontal className="h-4 w-4" />
									Espelhar
								</SlButton>
								<SlButton
									type="button"
									variant={grayscale ? "primary" : "secondary"}
									size="sm"
									onClick={() => setGrayscale((value) => !value)}
								>
									Preto e branco
								</SlButton>
							</div>
							<p className="text-xs text-[var(--sl-text-muted)]">Rotação atual: {rotate}°.</p>
						</div>

						<div className="space-y-2">
							<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
								Prévia salva
							</p>
							<div
								className="overflow-hidden border border-[var(--sl-line)] bg-[var(--sl-surface-quiet)]"
								style={radiusStyle}
							>
								<img
									key={previewUrl}
									src={previewUrl}
									alt="Prévia do recorte salvo"
									className="w-full object-contain"
								/>
							</div>
							<p className="text-xs text-[var(--sl-text-muted)]">
								Atualiza depois de salvar. Mostra o que já está gravado para esta proporção.
							</p>
						</div>

						<SlButton
							type="button"
							variant="primary"
							fullWidth
							onClick={() => void saveCrop()}
							disabled={saving}
						>
							{saving ? "Salvando..." : "Salvar recorte"}
						</SlButton>
						{status ? <p className="text-sm text-[var(--sl-text-muted)]">{status}</p> : null}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
