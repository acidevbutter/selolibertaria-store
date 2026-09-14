"use client";

import { useEffect, useRef, useState } from "react";

/** Named ratios (§5.2). The frame changes shape with the chip. */
const RATIOS = [
	{ id: "3/4", label: "Capa do evento · 3:4" },
	{ id: "16/9", label: "Faixa larga · 16:9" },
	{ id: "1/1", label: "Quadrada · 1:1" },
] as const;

export type CropResult = { cropId: string; alt: string };

type Frame = { left: number; top: number; width: number; height: number };

const INITIAL_FRAME: Frame = { left: 8, top: 12, width: 84, height: 62 };

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

/**
 * Recorte por cima (canvas 4f): the fatia 01 panel called from inside the
 * editor, never a new route. The scrim darkens the shell without hiding it and
 * the draft never reloads — confirming returns the caret where it was.
 *
 * The crop is stored as a `cropId` on the block. The original file stays intact
 * in the library: a crop is a reference, not a second upload.
 */
export function EditorialCropOverlay({
	open,
	fileName,
	dimensions,
	initialAlt,
	weightLine,
	onCancel,
	onConfirm,
}: {
	open: boolean;
	fileName: string;
	dimensions: string;
	initialAlt?: string;
	weightLine: string;
	onCancel: () => void;
	onConfirm: (result: CropResult) => void;
}) {
	const [ratio, setRatio] = useState<string>(RATIOS[0].id);
	const [frame, setFrame] = useState<Frame>(INITIAL_FRAME);
	const [alt, setAlt] = useState(initialAlt ?? "");
	const stageRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<{
		kind: "move" | "nw" | "ne" | "sw" | "se";
		x: number;
		y: number;
		frame: Frame;
	} | null>(null);

	useEffect(() => {
		setAlt(initialAlt ?? "");
	}, [initialAlt]);

	useEffect(() => {
		if (!open) return;
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") onCancel();
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [open, onCancel]);

	useEffect(() => {
		function onMove(event: PointerEvent) {
			const drag = dragRef.current;
			const stage = stageRef.current;
			if (!drag || !stage) return;
			const box = stage.getBoundingClientRect();
			const dx = ((event.clientX - drag.x) / box.width) * 100;
			const dy = ((event.clientY - drag.y) / box.height) * 100;
			const start = drag.frame;

			if (drag.kind === "move") {
				setFrame({
					...start,
					left: clamp(start.left + dx, 0, 100 - start.width),
					top: clamp(start.top + dy, 0, 100 - start.height),
				});
				return;
			}

			const east = drag.kind === "ne" || drag.kind === "se";
			const south = drag.kind === "se" || drag.kind === "sw";
			const width = clamp(east ? start.width + dx : start.width - dx, 10, 100);
			const height = clamp(south ? start.height + dy : start.height - dy, 10, 100);
			setFrame({
				left: clamp(east ? start.left : start.left + (start.width - width), 0, 100 - width),
				top: clamp(south ? start.top : start.top + (start.height - height), 0, 100 - height),
				width,
				height,
			});
		}

		function onUp() {
			dragRef.current = null;
		}

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
	}, []);

	function startDrag(kind: "move" | "nw" | "ne" | "sw" | "se", event: React.PointerEvent) {
		event.preventDefault();
		event.stopPropagation();
		dragRef.current = { kind, x: event.clientX, y: event.clientY, frame };
	}

	return (
		<div className={`ad-scrim${open ? " on" : ""}`}>
			<div className="ad-modal" role="dialog" aria-label="Recortar imagem">
				<div className="ad-mh">
					<b>Recortar imagem</b>
					<span className="ad-f">
						{fileName} · {dimensions}
					</span>
					<button
						type="button"
						style={{ marginLeft: "auto", fontSize: 18, color: "rgba(247,244,239,.7)" }}
						onClick={onCancel}
						aria-label="Fechar"
					>
						✕
					</button>
				</div>

				<div className="ad-mb">
					<div style={{ flex: "none", width: 260, display: "flex", flexDirection: "column", gap: 8 }}>
						<div className="ad-crop" ref={stageRef} style={{ aspectRatio: ratio }}>
							<span className="ad-dark" />
							<div
								className="ad-fr"
								style={{
									left: `${frame.left}%`,
									top: `${frame.top}%`,
									width: `${frame.width}%`,
									height: `${frame.height}%`,
								}}
								onPointerDown={(event) => startDrag("move", event)}
							>
								{(["nw", "ne", "sw", "se"] as const).map((handle) => (
									<span
										key={handle}
										className={`ad-h ad-${handle}`}
										onPointerDown={(event) => startDrag(handle, event)}
									/>
								))}
								<span className="ad-tag">Área visível</span>
							</div>
						</div>
						<p className="ad-doc-cap">Arraste a moldura para escolher o que aparece.</p>
						<p className="ad-mono" style={{ margin: 0, fontSize: 11, color: "var(--ad-text-faint)" }}>
							{Math.round(frame.width)}% × {Math.round(frame.height)}% da foto
						</p>
					</div>

					<div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 16 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
							<span className="ad-ml">Onde esta imagem vai aparecer</span>
							<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
								{RATIOS.map((entry) => (
									<button
										key={entry.id}
										type="button"
										className={`ad-chip${ratio === entry.id ? " on" : ""}`}
										onClick={() => setRatio(entry.id)}
									>
										{entry.label}
									</button>
								))}
							</div>
							<p className="ad-doc-cap">
								O recorte vale <strong>só neste bloco</strong>. A mesma foto em outra página mantém o recorte
								dela.
							</p>
						</div>

						<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
							<span className="ad-ml">Descreva a imagem</span>
							<textarea
								className="ad-area"
								rows={3}
								value={alt}
								onChange={(event) => setAlt(event.target.value)}
								aria-label="Descreva a imagem"
							/>
							<p className="ad-doc-cap">Serve para leitor de tela e para o Google achar a página.</p>
						</div>

						<div style={{ background: "var(--ad-sand)", padding: "12px 14px" }}>
							<p
								className="ad-mono"
								style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--ad-text-muted)" }}
							>
								{weightLine}
							</p>
						</div>
					</div>
				</div>

				<div className="ad-foot" style={{ borderTop: "1px solid var(--ad-line)" }}>
					<span style={{ fontSize: 13, color: "rgba(11,11,11,.65)" }}>
						O rascunho não recarrega: você volta com o cursor no mesmo ponto.
					</span>
					<span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
						<button type="button" className="ad-btn ad-sec" onClick={onCancel}>
							Cancelar
						</button>
						<button
							type="button"
							className="ad-btn ad-pri"
							onClick={() =>
								onConfirm({
									cropId: `${ratio.replace("/", "x")}-${Math.round(frame.left)}-${Math.round(frame.top)}-${Math.round(frame.width)}-${Math.round(frame.height)}`,
									alt,
								})
							}
						>
							Usar este recorte
						</button>
					</span>
				</div>
			</div>
		</div>
	);
}
