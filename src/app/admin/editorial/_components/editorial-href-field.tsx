import { AdminFieldHelp } from "@/app/admin/_components/admin-field-help";
import {
	EDITORIAL_HOME_CUSTOM_LINK_VALUE,
	EDITORIAL_LINK_HINT,
	EDITORIAL_LINK_OPTIONS,
	isEditorialPresetHref,
} from "@/lib/editorial-link-policy";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";

export function EditorialHrefField({
	label,
	name,
	defaultValue,
}: {
	label: string;
	name: string;
	defaultValue?: string | null;
}) {
	const normalizedValue = defaultValue?.trim() ?? "";
	const selectedPreset = isEditorialPresetHref(normalizedValue)
		? normalizedValue.replace(/\/$/, "")
		: normalizedValue
			? EDITORIAL_HOME_CUSTOM_LINK_VALUE
			: "";
	const customValue = selectedPreset === EDITORIAL_HOME_CUSTOM_LINK_VALUE ? normalizedValue : "";

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-1">
				<Label htmlFor={name}>{label}</Label>
				<AdminFieldHelp label={label}>
					Escolha onde este botão ou link leva. O destino aparece na página pública depois de salvar.
				</AdminFieldHelp>
			</div>
			<select
				id={name}
				name={`${name}Preset`}
				defaultValue={selectedPreset}
				className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
			>
				<option value="">Sem link</option>
				{EDITORIAL_LINK_OPTIONS.map((option) => (
					<option key={option.href} value={option.href}>
						{option.label} ({option.href})
					</option>
				))}
				<option value={EDITORIAL_HOME_CUSTOM_LINK_VALUE}>Personalizado</option>
			</select>
			<Input
				id={`${name}Custom`}
				name={`${name}Custom`}
				defaultValue={customValue}
				placeholder="https://exemplo.com ou /rota-customizada"
			/>
			<p className="text-xs leading-5 text-[color:var(--editorial-muted)]">{EDITORIAL_LINK_HINT}</p>
		</div>
	);
}
