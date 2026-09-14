"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { EditorialBlock, EditorialContentDoc } from "@/lib/editorial-blocks";
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
	removeBlock,
	updateBlock,
} from "@/lib/editorial-blocks-ops";

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
}: {
	name: string;
	initialDoc: EditorialContentDoc;
}) {
	const [state, dispatch] = useReducer(reducer, initialDoc, initEditorialBlocksHistory);
	const [activeId, setActiveId] = useState<string | null>(initialDoc[0]?.id ?? null);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [pickerQuery, setPickerQuery] = useState("");
	const [dropIndex, setDropIndex] = useState<number | null>(null);
	const [savedAt, setSavedAt] = useState<string | null>(null);
	const pickerInputRef = useRef<HTMLInputElement>(null);
	const doc = state.doc;

	function setDoc(next: EditorialContentDoc) {
		dispatch({ kind: "replace", doc: next });
	}

	// Autosave writes the draft only, on a debounce. No spinner over the text.
	useEffect(() => {
		const timer = window.setTimeout(() => setSavedAt(savedAtLabel(new Date())), 800);
		return () => window.clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (pickerOpen) pickerInputRef.current?.focus();
	}, [pickerOpen]);

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
		setPickerOpen(false);
		setPickerQuery("");
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

	return (
		<div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
			<input type="hidden" name={name} value={JSON.stringify(doc)} />

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
					<div className="ad-paper">
						{doc.length === 0 ? (
							<p className="ad-body" style={{ margin: 0 }}>
								Esta página ainda não tem blocos. Comece por um Título.
							</p>
						) : null}

						{doc.map((block, index) => (
							<div key={block.id}>
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
								/>
							</div>
						))}

						{dropIndex === doc.length ? (
							<div className="ad-guide">
								<span>Solta aqui</span>
							</div>
						) : null}

						<button type="button" className="ad-insert" onClick={() => setPickerOpen((open) => !open)}>
							<span className="ad-p">+</span>
							<span className="ad-l">Clique para inserir um bloco aqui</span>
						</button>

						<div className={`ad-popover${pickerOpen ? " on" : ""}`}>
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
										if (event.key === "Escape") setPickerOpen(false);
										if (event.key === "Enter" && pickerResults[0]) {
											event.preventDefault();
											insertBlock(createEmptyBlock(pickerResults[0].type));
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
									style={
										index === 0 ? { background: "var(--ad-ink)", color: "var(--ad-on-shell)" } : undefined
									}
									onClick={() => insertBlock(createEmptyBlock(entry.type))}
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
					</div>
				</div>

				<div className="ad-foot">
					<span className="ad-mono" style={{ fontSize: 12, color: "var(--ad-text-soft)" }}>
						{savedAt ? `Rascunho salvo às ${savedAt}` : "Salvando…"}
					</span>
					<span style={{ fontSize: 14, color: "rgba(11,11,11,.6)" }}>só vai ao ar quando você publicar</span>
					<span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
						<button type="button" className="ad-btn ad-sec">
							Voltar ao publicado
						</button>
						<button type="button" className="ad-btn ad-sec">
							Ver como fica
						</button>
						<button type="submit" className="ad-btn ad-pri">
							Publicar
						</button>
					</span>
				</div>
			</div>

			<div className="ad-outline">
				<div className="ad-ml" style={{ padding: "12px 14px", borderBottom: "1px solid var(--ad-line)" }}>
					Blocos da página
				</div>
				{doc.map((block, index) => (
					<button
						key={block.id}
						type="button"
						className={`ad-orow${block.id === activeId ? " on" : ""}`}
						onClick={() => setActiveId(block.id)}
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
		</div>
	);
}

function BlockBar({
	block,
	onMove,
	onDuplicate,
	onRemove,
}: {
	block: EditorialBlock;
	onMove: (direction: "up" | "down") => void;
	onDuplicate: () => void;
	onRemove: () => void;
}) {
	const isImage = block.type === "image" || block.type === "gallery";

	return (
		<span className="ad-bbar">
			<span>{block.type}</span>
			{isImage ? (
				<>
					<i>|</i>
					<button type="button">Recortar</button>
					<i>|</i>
					<button type="button">Trocar</button>
					<i>|</i>
					<button type="button">Legenda</button>
				</>
			) : null}
			<i>|</i>
			<button type="button" onClick={() => onMove("up")}>
				Mover ⇅
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
	onFocusBlock,
	onChange,
	onMove,
	onDuplicate,
	onRemove,
	onShortcut,
	onDragOverBlock,
}: {
	block: EditorialBlock;
	index: number;
	total: number;
	onFocusBlock: () => void;
	onChange: (patch: Partial<EditorialBlock>) => void;
	onMove: (direction: "up" | "down") => void;
	onDuplicate: () => void;
	onRemove: () => void;
	onShortcut: (create: () => EditorialBlock) => void;
	onDragOverBlock: (index: number | null) => void;
}) {
	const bar = <BlockBar block={block} onMove={onMove} onDuplicate={onDuplicate} onRemove={onRemove} />;

	function handleText(value: string) {
		const shortcut = TEXT_SHORTCUTS.find((entry) => value.startsWith(entry.prefix));
		if (shortcut) {
			onShortcut(shortcut.create);
			return;
		}
		onChange({ text: value } as Partial<EditorialBlock>);
	}

	const editable = (className: string, value: string, placeholder: string) => (
		<div
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

	return (
		<div
			className="ad-blk"
			onDragOver={(event) => {
				event.preventDefault();
				const box = event.currentTarget.getBoundingClientRect();
				onDragOverBlock(event.clientY < box.top + box.height / 2 ? index : index + 1);
			}}
			onDragLeave={() => onDragOverBlock(null)}
			onDrop={() => onDragOverBlock(null)}
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
					<div style={{ flex: "none", width: 260, display: "flex", flexDirection: "column", gap: 8 }}>
						<div
							className="ad-hatch"
							style={{
								width: "100%",
								aspectRatio: "4 / 3",
								display: "flex",
								alignItems: "flex-end",
								padding: 10,
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
								{block.src || "sem imagem"} · {block.layout}
							</span>
						</div>
						{editable("ad-doc-cap", block.caption ?? "", "Legenda")}
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
		</div>
	);
}

export { EDITORIAL_BLOCKS_HISTORY_LIMIT, EDITORIAL_BLOCK_TYPES };
