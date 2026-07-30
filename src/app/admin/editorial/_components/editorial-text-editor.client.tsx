"use client";

import { Bold, Heading3, Italic, Pilcrow, Quote } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useRef } from "react";
import { readEditorialText, serializeEditorialText } from "@/lib/editorial-style";
import { EditorialStyleControls } from "@/ui/editorial/editorial-style-controls.client";

type EditorialTextEditorProps = {
	name: string;
	defaultValue?: string | null;
	rows?: number;
};

type FormatAction = {
	label: string;
	icon: ComponentType<{ className?: string }>;
	apply: (selection: string) => { text: string; cursorOffset: number };
};

const actions: FormatAction[] = [
	{
		label: "Negrito",
		icon: Bold,
		apply: (selection) => {
			const text = selection || "texto em destaque";
			return { text: `**${text}**`, cursorOffset: 2 };
		},
	},
	{
		label: "Itálico",
		icon: Italic,
		apply: (selection) => {
			const text = selection || "texto";
			return { text: `_${text}_`, cursorOffset: 1 };
		},
	},
	{
		label: "Intertítulo",
		icon: Heading3,
		apply: (selection) => {
			const text = selection || "Intertítulo";
			return { text: `\n### ${text}\n`, cursorOffset: 5 };
		},
	},
	{
		label: "Citação",
		icon: Quote,
		apply: (selection) => {
			const text = selection || "Trecho em citação";
			return { text: `\n> ${text}\n`, cursorOffset: 3 };
		},
	},
	{
		label: "Parágrafo",
		icon: Pilcrow,
		apply: (selection) => {
			const text = selection || "Novo parágrafo";
			return { text: `\n\n${text}`, cursorOffset: 2 };
		},
	},
];

export function EditorialTextEditor({ name, defaultValue, rows = 4 }: EditorialTextEditorProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const initial = readEditorialText(defaultValue);
	useEffect(() => {
		const textarea = textareaRef.current;
		const form = textarea?.form;
		if (!textarea || !form) return;
		const onSubmit = () => {
			const style = Object.fromEntries(
				["font", "scale", "color", "emphasis"].map((key) => [
					key,
					(
						form.elements.namedItem(
							`${name}Style${key[0].toUpperCase()}${key.slice(1)}`,
						) as HTMLSelectElement | null
					)?.value,
				]),
			);
			textarea.value = serializeEditorialText(textarea.value, style);
		};
		form.addEventListener("submit", onSubmit);
		return () => form.removeEventListener("submit", onSubmit);
	}, [name]);

	function applyFormat(action: FormatAction) {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const before = textarea.value.slice(0, start);
		const selected = textarea.value.slice(start, end);
		const after = textarea.value.slice(end);
		const result = action.apply(selected);

		textarea.value = `${before}${result.text}${after}`;
		const selectionStart = start + result.cursorOffset;
		const selectionEnd = selected ? selectionStart + selected.length : start + result.text.length;
		textarea.focus();
		textarea.setSelectionRange(selectionStart, selectionEnd);
		textarea.dispatchEvent(new Event("input", { bubbles: true }));
	}

	return (
		<div className="overflow-hidden rounded-none border border-[color:var(--editorial-border)] bg-white/70">
			<div className="flex flex-wrap items-center gap-1 border-b border-[color:var(--editorial-border)] bg-[color:rgba(216,208,196,0.28)] px-2 py-2">
				{actions.map((action) => {
					const Icon = action.icon;
					return (
						<button
							key={action.label}
							type="button"
							title={action.label}
							aria-label={action.label}
							onClick={() => applyFormat(action)}
							className="inline-flex size-8 items-center justify-center border border-transparent text-[color:var(--editorial-ink)] transition-colors hover:border-[color:var(--editorial-border)] hover:bg-white/70 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[color:var(--editorial-accent)]"
						>
							<Icon className="size-4" />
						</button>
					);
				})}
			</div>
			<textarea
				ref={textareaRef}
				id={name}
				name={name}
				defaultValue={initial.source}
				rows={rows}
				className="min-h-24 w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 shadow-xs focus-visible:outline-hidden"
			/>
			<EditorialStyleControls name={name} defaultStyle={initial.style} />
		</div>
	);
}
