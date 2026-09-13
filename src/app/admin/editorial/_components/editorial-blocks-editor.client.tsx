"use client";

import {
	Bold,
	CalendarDays,
	ChevronDown,
	ChevronUp,
	Copy,
	Heading2,
	Heading3,
	Image as ImageIcon,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
	Minus,
	Pilcrow,
	Quote,
	Redo2,
	ShoppingBag,
	Sparkles,
	SquareMousePointer,
	Trash2,
	Underline,
	Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useReducer, useRef } from "react";
import type { EditorialBlock, EditorialContentDoc } from "@/lib/editorial-blocks";
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
import { EditorialBlocksRenderer } from "@/ui/editorial/editorial-blocks-renderer";
import { SlButton } from "@/ui/sl/sl-button";

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

function createListBlock(style: "bullet" | "number"): EditorialBlock {
	const block = createEmptyBlock("list") as Extract<EditorialBlock, { type: "list" }>;
	return { ...block, style };
}

function wrapSelection(textarea: HTMLTextAreaElement, before: string, after = before) {
	const { selectionStart: start, selectionEnd: end, value } = textarea;
	const selected = value.slice(start, end) || "texto";
	const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
	textarea.value = next;
	textarea.dispatchEvent(new Event("input", { bubbles: true }));
	textarea.focus();
	textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
}

export function EditorialBlocksEditor({
	name,
	initialDoc,
}: {
	name: string;
	initialDoc: EditorialContentDoc;
}) {
	const [state, dispatch] = useReducer(reducer, initialDoc, initEditorialBlocksHistory);
	const activeIdRef = useRef<string | null>(state.doc[0]?.id ?? null);
	const textareaRefs = useRef(new Map<string, HTMLTextAreaElement>());
	const doc = state.doc;

	function setDoc(next: EditorialContentDoc) {
		dispatch({ kind: "replace", doc: next });
	}

	function insertAfterActive(block: EditorialBlock) {
		activeIdRef.current = block.id;
		setDoc(insertBlockAfter(doc, activeIdRef.current, block));
	}

	function applyMark(kind: "bold" | "italic" | "underline" | "link") {
		const id = activeIdRef.current;
		const textarea = id ? textareaRefs.current.get(id) : null;
		if (!id || !textarea) return;
		if (kind === "bold") wrapSelection(textarea, "**");
		if (kind === "italic") wrapSelection(textarea, "_");
		if (kind === "underline") wrapSelection(textarea, "++");
		if (kind === "link") {
			const href = window.prompt("Link para (URL):", "https://");
			if (!href) return;
			const { selectionStart: start, selectionEnd: end, value } = textarea;
			const label = value.slice(start, end) || "link";
			const next = `${value.slice(0, start)}[${label}](${href})${value.slice(end)}`;
			textarea.value = next;
			textarea.dispatchEvent(new Event("input", { bubbles: true }));
		}
		setDoc(updateBlock(doc, id, { text: textarea.value } as Partial<EditorialBlock>));
	}

	function setLevel(level: "paragraph" | 2 | 3) {
		const id = activeIdRef.current;
		if (!id) return;
		setDoc(convertTextBlockLevel(doc, id, level));
	}

	const jsonValue = useMemo(() => JSON.stringify(doc), [doc]);

	return (
		<div className="border border-[color:var(--editorial-border)] bg-white/70">
			<input type="hidden" name={name} value={jsonValue} />
			<div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-[color:var(--editorial-border)] bg-[color:rgba(216,208,196,0.28)] px-2 py-2">
				<ToolbarButton label="Parágrafo" icon={Pilcrow} onClick={() => setLevel("paragraph")} />
				<ToolbarButton label="Título H2" icon={Heading2} onClick={() => setLevel(2)} />
				<ToolbarButton label="Título H3" icon={Heading3} onClick={() => setLevel(3)} />
				<Divider />
				<ToolbarButton label="Negrito" icon={Bold} onClick={() => applyMark("bold")} />
				<ToolbarButton label="Itálico" icon={Italic} onClick={() => applyMark("italic")} />
				<ToolbarButton label="Sublinhado" icon={Underline} onClick={() => applyMark("underline")} />
				<ToolbarButton label="Link" icon={LinkIcon} onClick={() => applyMark("link")} />
				<Divider />
				<ToolbarButton
					label="Lista"
					icon={List}
					onClick={() => insertAfterActive(createListBlock("bullet"))}
				/>
				<ToolbarButton
					label="Lista numerada"
					icon={ListOrdered}
					onClick={() => insertAfterActive(createListBlock("number"))}
				/>
				<ToolbarButton
					label="Citação"
					icon={Quote}
					onClick={() => insertAfterActive(createEmptyBlock("quote"))}
				/>
				<ToolbarButton
					label="Destaque do selo"
					icon={Sparkles}
					onClick={() => insertAfterActive(createEmptyBlock("highlight"))}
				/>
				<ToolbarButton
					label="Imagem"
					icon={ImageIcon}
					onClick={() => insertAfterActive(createEmptyBlock("image"))}
				/>
				<ToolbarButton
					label="Botão"
					icon={SquareMousePointer}
					onClick={() => insertAfterActive(createEmptyBlock("button"))}
				/>
				<ToolbarButton
					label="Separador"
					icon={Minus}
					onClick={() => insertAfterActive(createEmptyBlock("divider"))}
				/>
				<ToolbarButton
					label="Vitrine de produtos"
					icon={ShoppingBag}
					onClick={() => insertAfterActive(createEmptyBlock("productShelf"))}
				/>
				<ToolbarButton
					label="Agenda"
					icon={CalendarDays}
					onClick={() => insertAfterActive(createEmptyBlock("agenda"))}
				/>
				<Divider />
				<ToolbarButton
					label="Desfazer"
					icon={Undo2}
					disabled={state.past.length === 0}
					onClick={() => dispatch({ kind: "undo" })}
				/>
				<ToolbarButton
					label="Refazer"
					icon={Redo2}
					disabled={state.future.length === 0}
					onClick={() => dispatch({ kind: "redo" })}
				/>
			</div>

			<div className="space-y-3 p-4">
				{doc.length === 0 ? (
					<p className="text-sm text-[color:var(--editorial-muted)]">
						Nenhum bloco ainda. Use a barra acima para inserir o primeiro.
					</p>
				) : null}
				{doc.map((block, index) => (
					<BlockRow
						key={block.id}
						block={block}
						index={index}
						total={doc.length}
						textareaRefs={textareaRefs.current}
						onFocusBlock={() => {
							activeIdRef.current = block.id;
						}}
						onChange={(patch) => setDoc(updateBlock(doc, block.id, patch))}
						onMove={(direction) => setDoc(moveBlock(doc, block.id, direction))}
						onDuplicate={() => setDoc(duplicateBlock(doc, block.id))}
						onRemove={() => setDoc(removeBlock(doc, block.id))}
					/>
				))}
			</div>

			<details className="border-t border-[color:var(--editorial-border)] px-4 py-3">
				<summary className="cursor-pointer text-xs font-semibold text-[color:var(--editorial-muted)]">
					Ver como fica
				</summary>
				<div className="mt-3 border border-dashed border-[color:var(--editorial-border)] p-4">
					<EditorialBlocksRenderer doc={doc} />
				</div>
			</details>
		</div>
	);
}

function Divider() {
	return <span className="mx-1 h-6 w-px bg-[color:var(--editorial-border)]" />;
}

function ToolbarButton({
	label,
	icon: Icon,
	onClick,
	disabled,
}: {
	label: string;
	icon: typeof Bold;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			disabled={disabled}
			onClick={onClick}
			className="inline-flex size-8 items-center justify-center border border-transparent text-[color:var(--editorial-ink)] transition-colors hover:border-[color:var(--editorial-border)] hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[color:var(--editorial-accent)]"
		>
			<Icon className="size-4" />
		</button>
	);
}

function BlockShell({
	label,
	index,
	total,
	onMove,
	onDuplicate,
	onRemove,
	children,
}: {
	label: string;
	index: number;
	total: number;
	onMove: (direction: "up" | "down") => void;
	onDuplicate: () => void;
	onRemove: () => void;
	children: ReactNode;
}) {
	return (
		<div className="group relative border border-[color:var(--editorial-border)] bg-white/50 p-3">
			<div className="mb-2 flex items-center justify-between">
				<p className="text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
					{label}
				</p>
				<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
					<ToolbarButton
						label="Mover para cima"
						icon={ChevronUp}
						disabled={index === 0}
						onClick={() => onMove("up")}
					/>
					<ToolbarButton
						label="Mover para baixo"
						icon={ChevronDown}
						disabled={index === total - 1}
						onClick={() => onMove("down")}
					/>
					<ToolbarButton label="Duplicar" icon={Copy} onClick={onDuplicate} />
					<ToolbarButton label="Remover" icon={Trash2} onClick={onRemove} />
				</div>
			</div>
			{children}
		</div>
	);
}

function BlockRow({
	block,
	index,
	total,
	textareaRefs,
	onFocusBlock,
	onChange,
	onMove,
	onDuplicate,
	onRemove,
}: {
	block: EditorialBlock;
	index: number;
	total: number;
	textareaRefs: Map<string, HTMLTextAreaElement>;
	onFocusBlock: () => void;
	onChange: (patch: Partial<EditorialBlock>) => void;
	onMove: (direction: "up" | "down") => void;
	onDuplicate: () => void;
	onRemove: () => void;
}) {
	const shellProps = { index, total, onMove, onDuplicate, onRemove };

	switch (block.type) {
		case "heading":
		case "paragraph":
		case "quote":
		case "highlight":
			return (
				<BlockShell label={block.type === "heading" ? `Título H${block.level}` : block.type} {...shellProps}>
					<textarea
						ref={(el) => {
							if (el) textareaRefs.set(block.id, el);
							else textareaRefs.delete(block.id);
						}}
						rows={2}
						value={block.text}
						onFocus={onFocusBlock}
						onChange={(event) => onChange({ text: event.target.value } as Partial<EditorialBlock>)}
						className="w-full resize-y bg-transparent text-sm leading-6 focus-visible:outline-hidden"
						placeholder="Escreva aqui..."
					/>
					{block.type === "quote" ? (
						<input
							value={block.attribution ?? ""}
							onFocus={onFocusBlock}
							onChange={(event) => onChange({ attribution: event.target.value } as Partial<EditorialBlock>)}
							placeholder="Atribuição (opcional)"
							className="mt-2 w-full border-t border-[color:var(--editorial-border)] bg-transparent pt-2 text-xs focus-visible:outline-hidden"
						/>
					) : null}
				</BlockShell>
			);
		case "list":
			return (
				<BlockShell label={block.style === "number" ? "Lista numerada" : "Lista"} {...shellProps}>
					<div className="space-y-1">
						{block.items.map((item, itemIndex) => (
							<div key={itemIndex} className="flex items-center gap-2">
								<input
									value={item}
									onFocus={onFocusBlock}
									onChange={(event) => {
										const items = [...block.items];
										items[itemIndex] = event.target.value;
										onChange({ items } as Partial<EditorialBlock>);
									}}
									className="w-full bg-transparent text-sm focus-visible:outline-hidden"
								/>
								<ToolbarButton
									label="Remover item"
									icon={Trash2}
									onClick={() =>
										onChange({
											items: block.items.filter((_, i) => i !== itemIndex),
										} as Partial<EditorialBlock>)
									}
								/>
							</div>
						))}
						<button
							type="button"
							onClick={() => onChange({ items: [...block.items, ""] } as Partial<EditorialBlock>)}
							className="text-xs text-[color:var(--editorial-accent)] underline"
						>
							+ item
						</button>
					</div>
				</BlockShell>
			);
		case "image":
			return (
				<BlockShell label="Imagem" {...shellProps}>
					<p className="text-xs text-[color:var(--editorial-muted)]">
						{block.src
							? block.src
							: "Nenhuma imagem selecionada ainda (seleção via biblioteca de Mídia — fatia 02.5)."}
					</p>
					<input
						value={block.caption ?? ""}
						onFocus={onFocusBlock}
						onChange={(event) => onChange({ caption: event.target.value } as Partial<EditorialBlock>)}
						placeholder="Legenda"
						className="mt-2 w-full border-t border-[color:var(--editorial-border)] bg-transparent pt-2 text-xs focus-visible:outline-hidden"
					/>
				</BlockShell>
			);
		case "gallery":
			return (
				<BlockShell label="Galeria" {...shellProps}>
					<p className="text-xs text-[color:var(--editorial-muted)]">
						{block.images.length} imagem(ns) — seleção via biblioteca de Mídia (fatia 02.5).
					</p>
				</BlockShell>
			);
		case "button":
			return (
				<BlockShell label="Botão" {...shellProps}>
					<div className="flex flex-wrap items-center gap-2">
						<input
							value={block.label}
							onFocus={onFocusBlock}
							onChange={(event) => onChange({ label: event.target.value } as Partial<EditorialBlock>)}
							placeholder="Texto do botão"
							className="flex-1 bg-transparent text-sm focus-visible:outline-hidden"
						/>
						<input
							value={block.href}
							onFocus={onFocusBlock}
							onChange={(event) => onChange({ href: event.target.value } as Partial<EditorialBlock>)}
							placeholder="/destino"
							className="flex-1 bg-transparent text-sm focus-visible:outline-hidden"
						/>
					</div>
					<div className="mt-2">
						<SlButton variant="primary" size="sm" disabled>
							{block.label || "Botão"}
						</SlButton>
					</div>
				</BlockShell>
			);
		case "divider":
			return (
				<BlockShell label="Separador" {...shellProps}>
					<hr className="border-t border-[color:var(--editorial-border)]" />
				</BlockShell>
			);
		case "productShelf":
			return (
				<BlockShell label="Vitrine de produtos" {...shellProps}>
					<input
						value={block.productSlugs.join(", ")}
						onFocus={onFocusBlock}
						onChange={(event) =>
							onChange({
								productSlugs: event.target.value
									.split(",")
									.map((s) => s.trim())
									.filter(Boolean),
							} as Partial<EditorialBlock>)
						}
						placeholder="slug-do-produto, outro-slug"
						className="w-full bg-transparent text-sm focus-visible:outline-hidden"
					/>
				</BlockShell>
			);
		case "agenda":
			return (
				<BlockShell label="Agenda" {...shellProps}>
					<input
						value={block.eventSlugs.join(", ")}
						onFocus={onFocusBlock}
						onChange={(event) =>
							onChange({
								eventSlugs: event.target.value
									.split(",")
									.map((s) => s.trim())
									.filter(Boolean),
							} as Partial<EditorialBlock>)
						}
						placeholder="slug-do-evento, outro-slug"
						className="w-full bg-transparent text-sm focus-visible:outline-hidden"
					/>
				</BlockShell>
			);
	}
}

export { EDITORIAL_BLOCKS_HISTORY_LIMIT };
