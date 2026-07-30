"use client";

import type { EditorialTextStyle } from "@/lib/editorial-style";

export function EditorialStyleControls({
	name,
	defaultStyle,
}: {
	name: string;
	defaultStyle: EditorialTextStyle;
}) {
	const fields = [
		[
			"font",
			"Fonte",
			[
				["serif", "Editorial"],
				["sans", "Sem serifa"],
			],
		],
		[
			"scale",
			"Escala",
			[
				["sm", "Pequena"],
				["base", "Padrão"],
				["lg", "Grande"],
			],
		],
		[
			"color",
			"Cor",
			[
				["ink", "Preto"],
				["muted", "Grafite"],
				["wine", "Vinho"],
				["paper", "Papel"],
			],
		],
		[
			"emphasis",
			"Ênfase",
			[
				["normal", "Normal"],
				["strong", "Forte"],
			],
		],
	] as const;
	return (
		<fieldset className="grid gap-2 border-t border-[color:var(--editorial-border)] px-3 py-3 md:grid-cols-4">
			<legend className="sr-only">Estilo do texto</legend>
			{fields.map(([key, label, options]) => (
				<label key={key} className="grid gap-1 text-xs font-medium text-[color:var(--editorial-muted)]">
					{label}
					<select
						name={`${name}Style${key.charAt(0).toUpperCase()}${key.slice(1)}`}
						defaultValue={defaultStyle[key]}
						className="h-8 border border-[color:var(--editorial-border)] bg-white px-2 text-xs text-[color:var(--editorial-ink)]"
					>
						{options.map(([value, optionLabel]) => (
							<option key={value} value={value}>
								{optionLabel}
							</option>
						))}
					</select>
				</label>
			))}
		</fieldset>
	);
}
