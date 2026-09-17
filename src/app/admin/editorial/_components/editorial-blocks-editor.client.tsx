"use client";

import type { DragEvent, ReactNode } from "react";
import { useActionState, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { EditorialCropOverlay } from "@/app/admin/editorial/_components/editorial-crop-overlay.client";
import {
	type EditorialPageType,
	type PublishState,
	publishEditorialDraftAction,
} from "@/app/admin/editorial/blocks-actions";
import type { EditorialBlock, EditorialBlockWidth, EditorialContentDoc } from "@/lib/editorial-blocks";
import { EDITORIAL_BLOCK_TYPES, type EditorialBlockType } from "@/lib/editorial-blocks";
import {
	EDITORIAL_BLOCKS_HISTORY_LIMIT,
	type EditorialBlocksHistory,
	initEditorialBlocksHistory,
	pushEditorialBlocksHistory,
	redoEditorialBlocksHistory,
	undoEditorialBlocksHistory,
} from "@/lib/editorial-blocks-history";
import {
	convertTextBlockLevel,
	createEmptyBlock,
	duplicateBlock,
	insertBlockAfter,
	moveBlock,
	moveBlockToIndex,
	removeBlock,
	reorderBlock,
	updateBlock,
} from "@/lib/editorial-blocks-ops";
import { EditorialBlocksRenderer } from "@/ui/editorial/editorial-blocks-renderer";

type Action = { kind: "replace"; doc: EditorialContentDoc } | { kind: "undo" } | { kind: "redo" };

function reducer(state: EditorialBlocksHistory, action: Action): EditorialBlocksHistory {
	switch (action.kind) {
		case "replace":
			return pushEditorialBlocksHistory(state, action.doc);
		case "undo":
			return undoEditorialBlocksHistory(state);
		case "redo":
			return redoEditorialBlocksHistory(state);
	}
}

/** The closed list, in the picker's order. The label is the UI name; the mono
 *  value on the right is the schema type, so the team speaks the bank's language. */
const BLOCK_MENU: { type: EditorialBlockType; label: string }[] = [
	{ type: "heading", label: "Título" },
	{ type: "paragraph", label: "Parágrafo" },
	{ type: "list", label: "Lista" },
	{ type: "quote", label: "Citação" },
	{ type: "highlight", label: "Destaque do selo" },
	{ type: "image", label: "Imagem" },
	{ type: "gallery", label: "Galeria" },
	{ type: "button", label: "Botão" },
	{ type: "divider", label: "Separador" },
	{ type: "productShelf", label: "Vitrine de produtos" },
	{ type: "agenda", label: "Agenda" },
];

const BLOCK_LABEL = new Map(BLOCK_MENU.map((entry) => [entry.type, entry.label]));

/** Text shortcuts typed at the start of a line (§3). */
const TEXT_SHORTCUTS: { prefix: string; create: () => EditorialBlock }[] = [
	{ prefix: "## ", create: () => createEmptyBlock("heading") },
	{ prefix: "- ", create: () => createListBlock("bullet") },
	{ prefix: "1. ", create: () => createListBlock("number") },
	{ prefix: "> ", create: () => createEmptyBlock("quote") },
	{ prefix: "--- ", create: () => createEmptyBlock("divider") },
];

/** The four named shapes (§5.1). No pixel width, no free corner drag. */
const IMAGE_SHAPES = [
	{ id: "wide", label: "Faixa larga" },
	{ id: "side", label: "Ao lado" },
	{ id: "center", label: "Centralizada" },
	{ id: "gallery", label: "Galeria" },
] as const;

/** Mirrors imageLayoutClass in editorial-blocks-renderer.tsx (roughly, in
 *  pixels instead of Tailwind widths) so choosing a shape here actually
 *  looks different, instead of the fixed-260px box every layout used to get. */
const EDITOR_IMAGE_PREVIEW_WIDTH: Record<string, string> = {
	wide: "100%",
	side: "260px",
	center: "440px",
	gallery: "440px",
};

/** Above this the upload is refused — with the alternative, never bare (§6). */
const HEAVY_IMAGE_BYTES = 8 * 1024 * 1024;

/** Custom drag payload marking "this is one of our blocks", so the canvas's
 *  drop zone can tell a reorder apart from a file dragged in from outside. */
const BLOCK_DRAG_MIME = "application/x-editorial-block-id";

function formatMegabytes(bytes: number) {
	return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function createListBlock(style: "bullet" | "number"): EditorialBlock {
	const block = createEmptyBlock("list") as Extract<EditorialBlock, { type: "list" }>;
	return { ...block, style };
}

function normalize(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

function savedAtLabel(date: Date) {
	return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function EditorialBlocksEditor({
	name,
	initialDoc,
	contentType = "page",
	slug = "blocos-demo",
	initialPublishedAt = null,
	initialPublishedDoc = null,
}: {
	name: string;
	initialDoc: EditorialContentDoc;
	/** Which of the nine pages this instance edits — same component, different identity. */
	contentType?: EditorialPageType | "page";
	slug?: string;
	initialPublishedAt?: string | null;
	initialPublishedDoc?: EditorialContentDoc | null;
}) {
	const [state, dispatch] = useReducer(reducer, initialDoc, initEditorialBlocksHistory);
	const [publishedAtSeen, setPublishedAtSeen] = useState(initialPublishedAt ?? "");
	const [publishedDoc, setPublishedDoc] = useState(initialPublishedDoc);
	const [activeId, setActiveId] = useState<string | null>(initialDoc[0]?.id ?? null);
	const [pickerAnchor, setPickerAnchor] = useState<number | "end" | null>(null);
	const [pickerQuery, setPickerQuery] = useState("");
	const [dropIndex, setDropIndex] = useState<number | null>(null);
	const [dropTargetBlockId, setDropTargetBlockId] = useState<string | null>(null);
	const [savedAt, setSavedAt] = useState<string | null>(null);
	const [saving, setSaving] = useState(true);
	const [cropBlockId, setCropBlockId] = useState<string | null>(null);
	const [shapeBlockId, setShapeBlockId] = useState<string | null>(null);
	const [heavyImage, setHeavyImage] = useState<string | null>(null);
	const [uploadingIds, setUploadingIds] = useState<ReadonlySet<string>>(new Set());
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);
	const pickerInputRef = useRef<HTMLInputElement>(null);
	const swapInputRef = useRef<HTMLInputElement>(null);
	const swapBlockIdRef = useRef<string | null>(null);
	const [publishState, publish, publishing] = useActionState<PublishState, FormData>(
		publishEditorialDraftAction,
		{ status: "idle" },
	);
	const doc = state.doc;
	const docRef = useRef(doc);
	const imageCount = doc.reduce(
		(total, node) => total + (node.type === "image" ? 1 : node.type === "gallery" ? node.images.length : 0),
		0,
	);

	function setDoc(next: EditorialContentDoc) {
		dispatch({ kind: "replace", doc: next });
	}

	useEffect(() => {
		docRef.current = doc;
	}, [doc]);

	useEffect(() => {
		if (publishState.status === "published") setPublishedDoc(doc);
	}, [publishState, doc]);

	/** Uploads to the real backend (§6) — replaces the block's local blob preview
	 *  with the real URL/asset id once it lands, so `firstPendingImage` in
	 *  blocks-actions.ts stops seeing it as unfinished. */
	async function uploadImage(file: File, blockId: string) {
		setUploadingIds((prev) => new Set(prev).add(blockId));
		setUploadError(null);
		try {
			const formData = new FormData();
			formData.set("file", file);
			const response = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
			const payload = (await response.json().catch(() => ({}))) as {
				error?: string;
				url?: string;
				publicId?: string;
			};
			if (!response.ok || !payload.url || !payload.publicId) {
				throw new Error(payload.error || "Não foi possível enviar a imagem.");
			}
			setDoc(
				updateBlock(docRef.current, blockId, {
					src: payload.url,
					assetId: payload.publicId,
				} as Partial<EditorialBlock>),
			);
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
		} finally {
			setUploadingIds((prev) => {
				const next = new Set(prev);
				next.delete(blockId);
				return next;
			});
		}
	}

	// Autosave writes the draft only, on a debounce. No spinner over the text.
	useEffect(() => {
		setSaving(true);
		const timer = window.setTimeout(() => {
			setSaving(false);
			setSavedAt(savedAtLabel(new Date()));
		}, 800);
		return () => window.clearTimeout(timer);
	}, [doc]);

	useEffect(() => {
		if (pickerAnchor !== null) pickerInputRef.current?.focus();
	}, [pickerAnchor]);

	useEffect(() => {
		if (publishState.status === "published") setPublishedAtSeen(publishState.publishedAt);
	}, [publishState]);

	const pickerResults = useMemo(() => {
		const query = normalize(pickerQuery.trim());
		if (!query) return BLOCK_MENU;
		return BLOCK_MENU.filter(
			(entry) => normalize(entry.label).includes(query) || entry.type.toLowerCase().includes(query),
		);
	}, [pickerQuery]);

	function insertBlock(block: EditorialBlock, atIndex?: number) {
		const index = atIndex ?? doc.findIndex((item) => item.id === activeId);
		const anchorId = index >= 0 ? doc[index]?.id : doc[doc.length - 1]?.id;
		setDoc(insertBlockAfter(doc, anchorId ?? null, block));
		setActiveId(block.id);
		setPickerAnchor(null);
		setPickerQuery("");
	}

	/** The popover's chosen type always lands right after whichever "+" opened
	 *  it: the block at `pickerAnchor` if a specific one was hovered, or the
	 *  active/last block for the bar at the end of the canvas. */
	function pickInsert(type: EditorialBlockType) {
		insertBlock(createEmptyBlock(type), typeof pickerAnchor === "number" ? pickerAnchor : undefined);
	}

	/** Third beat of the drag (§5): local preview immediately, node in `wide`,
	 *  shape picker on the new block, real upload kicked off in the background —
	 *  the block's src/assetId swap to the real ones once it lands. */
	function acceptFile(file: File, atIndex: number) {
		setDropIndex(null);
		if (!file.type.startsWith("image/")) return;
		if (file.size > HEAVY_IMAGE_BYTES) {
			setHeavyImage(
				`Esta foto tem ${formatMegabytes(file.size)}. Podemos reduzir para 2 MB sem perda visível — ou escolha outra.`,
			);
			return;
		}
		setHeavyImage(null);
		const block = createEmptyBlock("image") as Extract<EditorialBlock, { type: "image" }>;
		const created: EditorialBlock = {
			...block,
			src: URL.createObjectURL(file),
			assetId: file.name,
			layout: "wide",
			alt: "",
		};
		const anchorId = atIndex > 0 ? doc[atIndex - 1]?.id : null;
		setDoc(insertBlockAfter(doc, anchorId ?? null, created));
		setActiveId(created.id);
		setShapeBlockId(created.id);
		void uploadImage(file, created.id);
	}

	/** Same upload, but replacing an existing block's image ("Trocar") instead of inserting a new one. */
	function swapImage(file: File, blockId: string) {
		if (!file.type.startsWith("image/")) return;
		if (file.size > HEAVY_IMAGE_BYTES) {
			setHeavyImage(
				`Esta foto tem ${formatMegabytes(file.size)}. Podemos reduzir para 2 MB sem perda visível — ou escolha outra.`,
			);
			return;
		}
		setHeavyImage(null);
		setDoc(
			updateBlock(doc, blockId, {
				src: URL.createObjectURL(file),
				assetId: file.name,
			} as Partial<EditorialBlock>),
		);
		void uploadImage(file, blockId);
	}

	function setShape(blockId: string, layout: (typeof IMAGE_SHAPES)[number]["id"]) {
		setDoc(updateBlock(doc, blockId, { layout } as Partial<EditorialBlock>));
	}

	function setLevel(level: "paragraph" | 2 | 3) {
		if (!activeId) return;
		setDoc(convertTextBlockLevel(doc, activeId, level));
	}

	/** Marks stay inline in the text value; the schema never carries styled HTML. */
	function applyMark(kind: "bold" | "italic" | "underline" | "link") {
		if (!activeId) return;
		const block = doc.find((item) => item.id === activeId);
		if (!block || !("text" in block)) return;
		const wrap = { bold: "**", italic: "_", underline: "++" } as const;
		if (kind === "link") {
			const href = window.prompt("Link para (URL):", "https://");
			if (!href) return;
			setDoc(updateBlock(doc, activeId, { text: `[${block.text}](${href})` } as Partial<EditorialBlock>));
			return;
		}
		const token = wrap[kind];
		setDoc(updateBlock(doc, activeId, { text: `${token}${block.text}${token}` } as Partial<EditorialBlock>));
	}

	const activeBlock = doc.find((item) => item.id === activeId) ?? null;
	const levelLabel = activeBlock?.type === "heading" ? `Título H${activeBlock.level}` : "Parágrafo";

	/** One popover definition, mounted at whichever "+" opened it (the bar at
	 *  the end of the canvas, or a specific block's hover button) -- never both. */
	const insertPopover = (
		<div className="ad-popover on">
			<div
				style={{
					padding: "14px 18px",
					borderBottom: "1px solid var(--ad-line)",
					display: "flex",
					flexDirection: "column",
					gap: 2,
				}}
			>
				<span className="ad-ml" style={{ color: "rgba(11,11,11,.55)" }}>
					Inserir bloco
				</span>
				<input
					ref={pickerInputRef}
					className="ad-mono"
					value={pickerQuery}
					onChange={(event) => setPickerQuery(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Escape") setPickerAnchor(null);
						if (event.key === "Enter" && pickerResults[0]) {
							event.preventDefault();
							pickInsert(pickerResults[0].type);
						}
					}}
					placeholder="digite para filtrar"
					style={{
						fontSize: 11,
						color: "var(--ad-text-faint)",
						border: 0,
						outline: "none",
						background: "none",
					}}
				/>
			</div>
			{pickerResults.map((entry, index) => (
				<button
					key={entry.type}
					type="button"
					className="ad-row"
					style={index === 0 ? { background: "var(--ad-ink)", color: "var(--ad-on-shell)" } : undefined}
					onClick={() => pickInsert(entry.type)}
				>
					<span className="ad-t">{entry.label}</span>
					<span className="ad-d" style={index === 0 ? { color: "rgba(247,244,239,.55)" } : undefined}>
						{entry.type}
					</span>
				</button>
			))}
			<div
				style={{
					background: "var(--ad-sand)",
					padding: "12px 18px",
					fontSize: 13,
					lineHeight: 1.6,
					color: "var(--ad-text-soft)",
				}}
			>
				Onze tipos. O servidor recusa qualquer outro com{" "}
				<span className="ad-mono" style={{ fontSize: 12 }}>
					422
				</span>
				.
			</div>
		</div>
	);

	return (
		<form action={publish} style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
			<input type="hidden" name={name} value={JSON.stringify(doc)} />
			<input type="hidden" name="contentDoc" value={JSON.stringify(doc)} />
			<input type="hidden" name="type" value={contentType} />
			<input type="hidden" name="slug" value={slug} />
			<input type="hidden" name="publishedAt" value={publishedAtSeen} />

			<div className="ad-editor" style={{ flex: "1 1 520px", minWidth: "min(520px, 100%)" }}>
				{/* Fourteen controls, four groups, in this exact order (§4). */}
				<div className="ad-etools">
					<button
						type="button"
						className="ad-tool"
						onClick={() => setLevel(activeBlock?.type === "heading" ? "paragraph" : 2)}
					>
						{levelLabel} ▾
					</button>
					<span className="ad-sep" />
					<button
						type="button"
						className="ad-tool ad-sq"
						style={{ fontWeight: 900 }}
						onClick={() => applyMark("bold")}
					>
						B
					</button>
					<button
						type="button"
						className="ad-tool ad-sq"
						style={{ fontStyle: "italic" }}
						onClick={() => applyMark("italic")}
					>
						I
					</button>
					<button
						type="button"
						className="ad-tool ad-sq"
						style={{ textDecoration: "underline" }}
						onClick={() => applyMark("underline")}
					>
						U
					</button>
					<button type="button" className="ad-tool" onClick={() => applyMark("link")}>
						Link
					</button>
					<span className="ad-sep" />
					<button type="button" className="ad-tool" onClick={() => insertBlock(createListBlock("bullet"))}>
						• Lista
					</button>
					<button type="button" className="ad-tool" onClick={() => insertBlock(createListBlock("number"))}>
						1. Numerada
					</button>
					<button type="button" className="ad-tool" onClick={() => insertBlock(createEmptyBlock("quote"))}>
						Citação
					</button>
					<span className="ad-sep" />
					<button
						type="button"
						className="ad-tool ad-accent"
						onClick={() => insertBlock(createEmptyBlock("highlight"))}
					>
						Destaque do selo
					</button>
					<button type="button" className="ad-tool" onClick={() => insertBlock(createEmptyBlock("image"))}>
						Imagem
					</button>
					<button type="button" className="ad-tool" onClick={() => insertBlock(createEmptyBlock("button"))}>
						Botão
					</button>
					<button type="button" className="ad-tool" onClick={() => insertBlock(createEmptyBlock("divider"))}>
						Separador
					</button>
					<span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
						<button
							type="button"
							className="ad-tool ad-sq"
							disabled={state.past.length === 0}
							onClick={() => dispatch({ kind: "undo" })}
							aria-label="Desfazer"
						>
							↩
						</button>
						<button
							type="button"
							className="ad-tool ad-sq"
							disabled={state.future.length === 0}
							onClick={() => dispatch({ kind: "redo" })}
							aria-label="Refazer"
						>
							↪
						</button>
						<span className="ad-mono" style={{ fontSize: 11, color: "var(--ad-text-quiet)" }}>
							{EDITORIAL_BLOCKS_HISTORY_LIMIT} passos
						</span>
					</span>
				</div>

				<div className="ad-stage">
					<div
						className="ad-paper"
						onDragOver={(event) => event.preventDefault()}
						onDrop={(event) => {
							event.preventDefault();
							const draggedBlockId = event.dataTransfer.getData?.(BLOCK_DRAG_MIME);
							if (draggedBlockId) {
								setDoc(moveBlockToIndex(doc, draggedBlockId, dropIndex ?? doc.length));
								setDraggedId(null);
								setDropIndex(null);
								setDropTargetBlockId(null);
								return;
							}
							const file = event.dataTransfer.files[0];
							if (file) {
								// Dropping onto an already-empty image block fills that block
								// instead of inserting a new one after it.
								if (dropTargetBlockId) swapImage(file, dropTargetBlockId);
								else acceptFile(file, dropIndex ?? doc.length);
							}
							setDropTargetBlockId(null);
						}}
					>
						{heavyImage ? (
							<p
								style={{
									width: "100%",
									margin: 0,
									background: "var(--ad-wine-wash-solid)",
									border: "1px solid var(--ad-wine-line)",
									color: "var(--ad-wine)",
									padding: "12px 14px",
									fontSize: 14,
									lineHeight: 1.7,
								}}
							>
								{heavyImage}
							</p>
						) : null}
						{doc.length === 0 ? (
							<button
								type="button"
								className="ad-body"
								style={{ width: "100%", margin: 0, textAlign: "left", padding: 0 }}
								onClick={() => setPickerAnchor("end")}
							>
								Esta página ainda não tem blocos. Comece por um Título.
							</button>
						) : null}

						{doc.map((block, index) => (
							<div key={block.id} style={{ width: block.width === "half" ? "calc(50% - 10px)" : "100%" }}>
								{/* The guide only ever lands between blocks, never mid-sentence. */}
								{dropIndex === index ? (
									<div className="ad-guide">
										<span>Solta aqui</span>
									</div>
								) : null}
								<BlockRow
									block={block}
									index={index}
									total={doc.length}
									uploading={uploadingIds.has(block.id)}
									dragging={draggedId === block.id}
									isDropTarget={dropTargetBlockId === block.id}
									onFocusBlock={() => setActiveId(block.id)}
									onChange={(patch) => setDoc(updateBlock(doc, block.id, patch))}
									onMove={(direction) => setDoc(moveBlock(doc, block.id, direction))}
									onDuplicate={() => setDoc(duplicateBlock(doc, block.id))}
									onRemove={() => setDoc(removeBlock(doc, block.id))}
									onShortcut={(create) => {
										const created = create();
										setDoc(updateBlock(doc, block.id, { text: "" } as Partial<EditorialBlock>));
										insertBlock(created, index);
									}}
									onDragOverBlock={(position) => setDropIndex(position)}
									onDragOverImageTarget={(id) => setDropTargetBlockId(id)}
									onDragStart={(event) => {
										setDraggedId(block.id);
										event.dataTransfer.setData(BLOCK_DRAG_MIME, block.id);
										event.dataTransfer.effectAllowed = "move";
									}}
									onDragEnd={() => {
										setDraggedId(null);
										setDropIndex(null);
										setDropTargetBlockId(null);
									}}
									onCrop={() => setCropBlockId(block.id)}
									onSwap={() => {
										swapBlockIdRef.current = block.id;
										swapInputRef.current?.click();
									}}
									shapePicker={
										shapeBlockId === block.id ? (
											<ImageShapePicker
												current={block.type === "image" ? block.layout : "wide"}
												onPick={(layout) => setShape(block.id, layout)}
												onClose={() => setShapeBlockId(null)}
											/>
										) : null
									}
									onToggleInsert={() => setPickerAnchor((current) => (current === index ? null : index))}
									insertPopover={pickerAnchor === index ? insertPopover : null}
								/>
							</div>
						))}

						{dropIndex === doc.length ? (
							<div className="ad-guide">
								<span>Solta aqui</span>
							</div>
						) : null}

						<button
							type="button"
							className="ad-insert"
							onClick={() => setPickerAnchor((current) => (current === "end" ? null : "end"))}
						>
							<span className="ad-p">+</span>
							<span className="ad-l">Clique para inserir um bloco aqui</span>
						</button>

						{pickerAnchor === "end" ? insertPopover : null}
					</div>
				</div>

				<PublishBanner state={publishState} publishing={publishing} blocks={doc.length} images={imageCount} />

				<div className="ad-foot" style={{ position: "relative" }}>
					{saving ? (
						<span
							style={{
								position: "absolute",
								left: 0,
								right: 0,
								top: 0,
								height: 2,
								background: "var(--ad-wine)",
							}}
						/>
					) : null}
					<span className="ad-mono" style={{ fontSize: 12, color: "var(--ad-text-soft)" }}>
						{saving || !savedAt ? "Salvando…" : `Rascunho salvo às ${savedAt}`}
					</span>
					<span style={{ fontSize: 14, color: "rgba(11,11,11,.6)" }}>só vai ao ar quando você publicar</span>
					<span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
						<button
							type="button"
							className="ad-btn ad-sec"
							disabled={!publishedDoc}
							onClick={() => {
								if (!publishedDoc) return;
								if (
									window.confirm(
										"Substituir o rascunho pela última versão publicada? Isso descarta as edições não publicadas.",
									)
								) {
									setDoc(publishedDoc);
								}
							}}
						>
							Voltar ao publicado
						</button>
						<button type="button" className="ad-btn ad-sec" onClick={() => setPreviewOpen(true)}>
							Ver como fica
						</button>
						<button type="submit" className="ad-btn ad-pri">
							Publicar
						</button>
					</span>
				</div>
				{uploadError ? (
					<div
						style={{
							background: "var(--ad-wine-wash-solid)",
							border: "1px solid var(--ad-wine-line)",
							color: "var(--ad-wine)",
							padding: "12px 14px",
							fontSize: 14,
							lineHeight: 1.7,
						}}
					>
						{uploadError}
					</div>
				) : null}
			</div>

			<input
				ref={swapInputRef}
				type="file"
				accept="image/*"
				style={{ display: "none" }}
				onChange={(event) => {
					const file = event.target.files?.[0];
					const blockId = swapBlockIdRef.current;
					if (file && blockId) swapImage(file, blockId);
					event.target.value = "";
				}}
			/>

			<div className={`ad-scrim${previewOpen ? " on" : ""}`}>
				<div className="ad-modal" role="dialog" aria-label="Ver como fica">
					<div className="ad-mh">
						<b>Ver como fica</b>
						<span className="ad-f">{doc.length} blocos</span>
						<button
							type="button"
							style={{ marginLeft: "auto", fontSize: 18, color: "rgba(247,244,239,.7)" }}
							onClick={() => setPreviewOpen(false)}
							aria-label="Fechar"
						>
							✕
						</button>
					</div>
					<div style={{ padding: "36px 40px", background: "var(--ad-paper)" }}>
						<EditorialBlocksRenderer doc={doc} />
					</div>
				</div>
			</div>

			<EditorialCropOverlay
				open={cropBlockId !== null}
				fileName={
					(doc.find((item) => item.id === cropBlockId) as { assetId?: string } | undefined)?.assetId ??
					"imagem"
				}
				dimensions="3024×4032"
				initialAlt={
					(doc.find((item) => item.id === cropBlockId) as { alt?: string | null } | undefined)?.alt ?? ""
				}
				weightLine="2,1 MB → 240 KB · webp + jpg · usada em 3 lugares"
				onCancel={() => setCropBlockId(null)}
				onConfirm={({ cropId, alt }) => {
					if (cropBlockId) {
						setDoc(updateBlock(doc, cropBlockId, { cropId, alt } as Partial<EditorialBlock>));
					}
					setCropBlockId(null);
				}}
			/>

			<div className="ad-outline">
				<div className="ad-ml" style={{ padding: "12px 14px", borderBottom: "1px solid var(--ad-line)" }}>
					Blocos da página
				</div>
				{doc.map((block, index) => (
					<button
						key={block.id}
						type="button"
						draggable
						className={`ad-orow${block.id === activeId ? " on" : ""}`}
						style={draggedId === block.id ? { opacity: 0.4 } : undefined}
						onClick={() => setActiveId(block.id)}
						onDragStart={(event) => {
							setDraggedId(block.id);
							if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
						}}
						onDragEnd={() => setDraggedId(null)}
						onDragOver={(event) => event.preventDefault()}
						onDrop={(event) => {
							event.preventDefault();
							if (draggedId) setDoc(reorderBlock(doc, draggedId, block.id));
							setDraggedId(null);
						}}
					>
						<span className="ad-i">{String(index + 1).padStart(2, "0")}</span>
						<span style={{ fontSize: 14 }}>{BLOCK_LABEL.get(block.type) ?? block.type}</span>
					</button>
				))}
				<div
					style={{
						marginTop: "auto",
						padding: "12px 14px",
						background: "var(--ad-sand)",
						fontSize: 12,
						lineHeight: 1.6,
						color: "var(--ad-text-soft)",
					}}
				>
					Arraste na lista para reordenar sem rolar a página.
				</div>
			</div>
		</form>
	);
}

/**
 * The publish states (§6). An error stays on the screen with what to do and
 * what was NOT lost — never a toast that disappears.
 */
function PublishBanner({
	state,
	publishing,
	blocks,
	images,
}: {
	state: PublishState;
	publishing: boolean;
	blocks: number;
	images: number;
}) {
	if (publishing) {
		return (
			<div className="ad-foot" style={{ borderTop: "1px solid var(--ad-line)" }}>
				<span className="ad-badge ad-b-run">Publicando</span>
				<span className="ad-mono" style={{ fontSize: 12, color: "var(--ad-text-soft)" }}>
					{blocks} blocos · {images} imagens
				</span>
			</div>
		);
	}

	if (state.status === "idle") return null;

	if (state.status === "published") {
		return (
			<div className="ad-foot" style={{ borderTop: "1px solid var(--ad-line)" }}>
				<span className="ad-badge ad-b-pub">Publicado</span>
				<span className="ad-mono" style={{ fontSize: 12, color: "var(--ad-text-soft)" }}>
					{state.blocks} blocos · {state.images} imagens
				</span>
			</div>
		);
	}

	if (state.status === "conflict") {
		return (
			<div
				style={{
					background: "var(--ad-sheet)",
					borderTop: "1px solid var(--ad-line)",
					padding: "14px 20px",
					display: "flex",
					flexDirection: "column",
					gap: 10,
				}}
			>
				<span className="ad-badge ad-b-err">Falhou</span>
				<p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{state.message}</p>
				<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
					<div style={{ flex: "1 1 240px", border: "1px solid var(--ad-line)", padding: 12 }}>
						<p className="ad-eb">O seu rascunho</p>
						<p className="ad-mono" style={{ margin: "8px 0 0", fontSize: 12 }}>
							{blocks} blocos · {images} imagens
						</p>
					</div>
					<div style={{ flex: "1 1 240px", border: "1px solid var(--ad-line)", padding: 12 }}>
						<p className="ad-eb">O que está no ar</p>
						<p className="ad-mono" style={{ margin: "8px 0 0", fontSize: 12 }}>
							publicado {state.theirs}
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			style={{
				background: "var(--ad-sheet)",
				borderTop: "1px solid var(--ad-line)",
				padding: "14px 20px",
				display: "flex",
				alignItems: "center",
				gap: 14,
				flexWrap: "wrap",
			}}
		>
			<span className="ad-badge ad-b-err">Falhou</span>
			<p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{state.message}</p>
			{state.status === "invalid" ? (
				<span className="ad-mono" style={{ fontSize: 12, color: "var(--ad-text-soft)" }}>
					422
				</span>
			) : null}
		</div>
	);
}

/** Chips on the freshly created block: Enter confirms, Esc keeps faixa larga. */
function ImageShapePicker({
	current,
	onPick,
	onClose,
}: {
	current: string;
	onPick: (layout: (typeof IMAGE_SHAPES)[number]["id"]) => void;
	onClose: () => void;
}) {
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Enter" || event.key === "Escape") {
				event.preventDefault();
				onClose();
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
			<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
				{IMAGE_SHAPES.map((shape) => (
					<button
						key={shape.id}
						type="button"
						className={`ad-chip${current === shape.id ? " on" : ""}`}
						onClick={() => onPick(shape.id)}
					>
						{shape.label}
					</button>
				))}
			</div>
			<span className="ad-mono" style={{ fontSize: 11, color: "var(--ad-text-faint)" }}>
				enter confirma · esc mantém faixa larga
			</span>
		</div>
	);
}

function BlockBar({
	block,
	index,
	total,
	onMove,
	onDuplicate,
	onRemove,
	onCrop,
	onSwap,
	onFocusCaption,
	onFocusCredit,
	onSetWidth,
	onDragStart,
	onDragEnd,
}: {
	block: EditorialBlock;
	index: number;
	total: number;
	onMove: (direction: "up" | "down") => void;
	onDuplicate: () => void;
	onRemove: () => void;
	onCrop: () => void;
	onSwap: () => void;
	onFocusCaption: () => void;
	onFocusCredit: () => void;
	onSetWidth: (width: EditorialBlockWidth) => void;
	onDragStart: (event: DragEvent) => void;
	onDragEnd: () => void;
}) {
	const isImage = block.type === "image" || block.type === "gallery";
	const isHalf = block.width === "half";

	return (
		<span
			className="ad-bbar"
			draggable
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			style={{ cursor: "grab" }}
		>
			<span aria-hidden="true" style={{ letterSpacing: -1 }}>
				⠿
			</span>
			<span>{block.type}</span>
			<i>|</i>
			<button type="button" onClick={() => onSetWidth(isHalf ? "full" : "half")}>
				{isHalf ? "Metade" : "Linha inteira"}
			</button>
			{isImage ? (
				<>
					<i>|</i>
					<button type="button" onClick={onCrop}>
						Recortar
					</button>
					<i>|</i>
					<button type="button" onClick={onSwap}>
						Trocar
					</button>
					<i>|</i>
					<button type="button" onClick={onFocusCaption}>
						Legenda
					</button>
					{block.type === "image" ? (
						<>
							<i>|</i>
							<button type="button" onClick={onFocusCredit}>
								Crédito
							</button>
						</>
					) : null}
				</>
			) : null}
			<i>|</i>
			<button type="button" disabled={index === 0} onClick={() => onMove("up")} aria-label="Mover para cima">
				▲
			</button>
			<button
				type="button"
				disabled={index === total - 1}
				onClick={() => onMove("down")}
				aria-label="Mover para baixo"
			>
				▼
			</button>
			{isImage ? null : (
				<>
					<i>|</i>
					<button type="button" onClick={onDuplicate}>
						Duplicar
					</button>
				</>
			)}
			<i>|</i>
			<button type="button" onClick={onRemove}>
				Remover
			</button>
		</span>
	);
}

/** Blocks render with the published typography (doc-*), so "ver como fica" is
 *  the same measure as the live page. Editing is plain text — no HTML in, ever. */
function BlockRow({
	block,
	index,
	total,
	uploading,
	dragging,
	isDropTarget,
	onFocusBlock,
	onChange,
	onMove,
	onDuplicate,
	onRemove,
	onShortcut,
	onDragOverBlock,
	onDragOverImageTarget,
	onDragStart,
	onDragEnd,
	onCrop,
	onSwap,
	shapePicker,
	onToggleInsert,
	insertPopover,
}: {
	block: EditorialBlock;
	index: number;
	total: number;
	uploading: boolean;
	dragging: boolean;
	isDropTarget: boolean;
	onFocusBlock: () => void;
	onChange: (patch: Partial<EditorialBlock>) => void;
	onMove: (direction: "up" | "down") => void;
	onDuplicate: () => void;
	onRemove: () => void;
	onShortcut: (create: () => EditorialBlock) => void;
	onDragOverBlock: (index: number | null) => void;
	onDragOverImageTarget: (blockId: string | null) => void;
	onDragStart: (event: DragEvent) => void;
	onDragEnd: () => void;
	onCrop: () => void;
	onSwap: () => void;
	shapePicker: ReactNode;
	onToggleInsert: () => void;
	insertPopover: ReactNode;
}) {
	const captionId = `caption-${block.id}`;
	const creditId = `credit-${block.id}`;
	const bar = (
		<BlockBar
			block={block}
			index={index}
			total={total}
			onMove={onMove}
			onDuplicate={onDuplicate}
			onRemove={onRemove}
			onCrop={onCrop}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onSwap={onSwap}
			onFocusCaption={() => document.getElementById(captionId)?.focus()}
			onFocusCredit={() => document.getElementById(creditId)?.focus()}
			onSetWidth={(width) => onChange({ width } as Partial<EditorialBlock>)}
		/>
	);

	function handleText(value: string) {
		const shortcut = TEXT_SHORTCUTS.find((entry) => value.startsWith(entry.prefix));
		if (shortcut) {
			onShortcut(shortcut.create);
			return;
		}
		onChange({ text: value } as Partial<EditorialBlock>);
	}

	const editable = (className: string, value: string, placeholder: string, id?: string) => (
		<div
			id={id}
			className={className}
			contentEditable
			suppressContentEditableWarning
			role="textbox"
			tabIndex={0}
			aria-label={placeholder}
			data-placeholder={placeholder}
			onFocus={onFocusBlock}
			onInput={(event) => handleText(event.currentTarget.textContent ?? "")}
			onPaste={(event) => {
				event.preventDefault();
				const text = event.clipboardData.getData("text/plain");
				document.execCommand("insertText", false, text);
			}}
		>
			{value}
		</div>
	);

	const isEmptyImage = block.type === "image" && !block.src;

	return (
		<div
			className="ad-blk"
			style={dragging ? { opacity: 0.4 } : undefined}
			onDragOver={(event) => {
				event.preventDefault();
				if (isEmptyImage) {
					onDragOverBlock(null);
					onDragOverImageTarget(block.id);
					return;
				}
				const box = event.currentTarget.getBoundingClientRect();
				onDragOverBlock(event.clientY < box.top + box.height / 2 ? index : index + 1);
			}}
			onDragLeave={() => {
				onDragOverBlock(null);
				onDragOverImageTarget(null);
			}}
			onDrop={() => {
				onDragOverBlock(null);
				onDragOverImageTarget(null);
			}}
		>
			{bar}
			{block.type === "heading" ? editable("ad-doc-h2", block.text, "Título") : null}
			{block.type === "paragraph" ? editable("ad-doc-p", block.text, "Parágrafo") : null}
			{block.type === "highlight" ? (
				<div className="ad-doc-hl">
					<p className="ad-eb">Destaque do selo</p>
					{editable("", block.text, "Destaque do selo")}
				</div>
			) : null}
			{block.type === "quote" ? (
				<blockquote className="ad-doc-q">{editable("", block.text, "Citação")}</blockquote>
			) : null}
			{block.type === "list" ? (
				<ul className="ad-doc-ul">
					{block.items.map((item, itemIndex) => (
						<li key={itemIndex}>
							<span
								contentEditable
								suppressContentEditableWarning
								role="textbox"
								tabIndex={0}
								aria-label={`Item ${itemIndex + 1}`}
								onFocus={onFocusBlock}
								onInput={(event) => {
									const items = [...block.items];
									items[itemIndex] = event.currentTarget.textContent ?? "";
									onChange({ items } as Partial<EditorialBlock>);
								}}
							>
								{item}
							</span>
						</li>
					))}
				</ul>
			) : null}
			{block.type === "divider" ? <hr style={{ border: 0, borderTop: "1px solid var(--ad-line)" }} /> : null}
			{block.type === "image" ? (
				<div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
					<div
						style={{
							flex: "none",
							width: EDITOR_IMAGE_PREVIEW_WIDTH[block.layout] ?? "100%",
							marginInline: block.layout === "center" || block.layout === "gallery" ? "auto" : undefined,
							display: "flex",
							flexDirection: "column",
							gap: 8,
						}}
					>
						{block.src ? (
							<div
								style={{
									position: "relative",
									width: "100%",
									aspectRatio: "4 / 3",
									overflow: "hidden",
									background: "var(--ad-sand)",
								}}
							>
								{/* Local blob and remote URLs both render fine with a plain <img>. */}
								<img
									src={block.src}
									alt={block.alt ?? ""}
									style={{ width: "100%", height: "100%", objectFit: "cover", opacity: uploading ? 0.5 : 1 }}
								/>
								{uploading ? (
									<span
										className="ad-mono"
										style={{
											position: "absolute",
											left: 8,
											bottom: 8,
											fontSize: 11,
											background: "var(--ad-ink)",
											color: "var(--ad-on-shell)",
											padding: "3px 6px",
										}}
									>
										Enviando…
									</span>
								) : null}
							</div>
						) : (
							<button
								type="button"
								className="ad-hatch"
								onClick={onSwap}
								style={{
									width: "100%",
									aspectRatio: "4 / 3",
									display: "flex",
									alignItems: "flex-end",
									padding: 10,
									border: isDropTarget ? "2px dashed var(--ad-wine)" : 0,
									textAlign: "left",
								}}
							>
								<span
									className="ad-mono"
									style={{
										fontSize: 11,
										background: "var(--ad-paper)",
										padding: "3px 6px",
										color: "rgba(11,11,11,.6)",
									}}
								>
									{isDropTarget
										? "Solte para usar nesta imagem"
										: `Clique para enviar uma imagem · ${block.layout}`}
								</span>
							</button>
						)}
						<div
							id={captionId}
							className="ad-doc-cap"
							contentEditable
							suppressContentEditableWarning
							role="textbox"
							tabIndex={0}
							aria-label="Legenda"
							data-placeholder="Legenda"
							onFocus={onFocusBlock}
							onInput={(event) =>
								onChange({ caption: event.currentTarget.textContent ?? "" } as Partial<EditorialBlock>)
							}
							onPaste={(event) => {
								event.preventDefault();
								const text = event.clipboardData.getData("text/plain");
								document.execCommand("insertText", false, text);
							}}
						>
							{block.caption ?? ""}
						</div>
						{block.type === "image" ? (
							<div
								id={creditId}
								className="ad-doc-cap"
								style={{ opacity: 0.7 }}
								contentEditable
								suppressContentEditableWarning
								role="textbox"
								tabIndex={0}
								aria-label="Crédito"
								data-placeholder="Crédito (ex: Foto de Fulano)"
								onFocus={onFocusBlock}
								onInput={(event) =>
									onChange({ credit: event.currentTarget.textContent ?? "" } as Partial<EditorialBlock>)
								}
								onPaste={(event) => {
									event.preventDefault();
									const text = event.clipboardData.getData("text/plain");
									document.execCommand("insertText", false, text);
								}}
							>
								{block.credit ?? ""}
							</div>
						) : null}
						{shapePicker}
					</div>
				</div>
			) : null}
			{block.type === "gallery" ? (
				<p className="ad-doc-cap">{block.images.length} imagem(ns) na galeria.</p>
			) : null}
			{block.type === "button" ? (
				<span className="ad-btn ad-ink" style={{ alignSelf: "flex-start" }}>
					{block.label || "Botão"}
				</span>
			) : null}
			{block.type === "productShelf" ? (
				<p className="ad-doc-cap">
					Vitrine · {block.productSlugs.length} título(s). Preço e estoque vêm do catálogo.
				</p>
			) : null}
			{block.type === "agenda" ? (
				<p className="ad-doc-cap">Agenda · {block.eventSlugs.length} evento(s) publicado(s).</p>
			) : null}
			<span className="sr-only">
				Bloco {index + 1} de {total}
			</span>
			{/* Nested inside .ad-blk (not a sibling) so hovering the button itself,
			 *  even though it visually pokes past the block's bottom border, still
			 *  counts as hovering .ad-blk and keeps it visible. */}
			<button type="button" className="ad-blk-add" aria-label="Inserir bloco abaixo" onClick={onToggleInsert}>
				+
			</button>
			{insertPopover}
		</div>
	);
}

export { EDITORIAL_BLOCKS_HISTORY_LIMIT, EDITORIAL_BLOCK_TYPES };
