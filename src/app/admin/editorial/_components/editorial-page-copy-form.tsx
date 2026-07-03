"use client";

import { useActionState } from "react";
import { EditorialFloatingSaveBar } from "@/app/admin/editorial/_components/editorial-floating-save-bar";
import type { PageCopyActionState } from "@/app/admin/editorial/page-content-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";

type FieldType = "text" | "textarea";

type FieldConfig = {
	name: string;
	label: string;
	help?: string;
	route?: string;
	type?: FieldType;
	rows?: number;
	defaultValue?: string | null;
};

type SectionConfig = {
	title: string;
	description?: string;
	route: string;
	fields: FieldConfig[];
	defaultOpen?: boolean;
};

type PublishedState = {
	published: boolean;
};

const INITIAL_STATE: PageCopyActionState = {
	status: "idle",
	message: null,
	savedAt: null,
};

function formatSavedAt(savedAt: string | null) {
	if (!savedAt) {
		return null;
	}

	const date = new Date(savedAt);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
		timeZone: "America/Sao_Paulo",
	}).format(date);
}

function Textarea({
	name,
	defaultValue,
	rows = 4,
}: {
	name: string;
	defaultValue?: string | null;
	rows?: number;
}) {
	return (
		<textarea
			name={name}
			defaultValue={defaultValue ?? ""}
			rows={rows}
			className="min-h-24 w-full rounded-none border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:outline-hidden"
		/>
	);
}

function Field({ field }: { field: FieldConfig }) {
	return (
		<label className="grid gap-2">
			<span className="text-sm font-medium text-[color:var(--editorial-ink)]">{field.label}</span>
			{field.route ? (
				<span className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
					Aparece em: {field.route}
				</span>
			) : null}
			{field.type === "textarea" ? (
				<Textarea name={field.name} defaultValue={field.defaultValue} rows={field.rows} />
			) : (
				<Input name={field.name} defaultValue={field.defaultValue ?? ""} />
			)}
			{field.help ? (
				<span className="text-xs leading-5 text-[color:var(--editorial-muted)]">{field.help}</span>
			) : null}
		</label>
	);
}

export function EditorialPageCopyForm({
	action,
	submitLabel,
	base,
	sections,
}: {
	action: (state: PageCopyActionState, formData: FormData) => Promise<PageCopyActionState>;
	submitLabel: string;
	base: PublishedState;
	sections: SectionConfig[];
}) {
	const [state, formAction] = useActionState(action, INITIAL_STATE);
	const savedAtLabel = formatSavedAt(state.savedAt);

	return (
		<form action={formAction} className="space-y-6 pb-28 md:pb-32">
			<Card className="rounded-none border-[color:var(--editorial-border)]">
				<CardHeader>
					<CardTitle className="text-xl text-[color:var(--editorial-ink)]">Publicação</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<p className="max-w-2xl text-sm leading-6 text-[color:var(--editorial-muted)]">
						Este bloco só controla se a versão salva já deve aparecer na rota pública. Os textos e CTAs abaixo
						continuam sendo a fonte principal da página.
					</p>
					<div>
						<span className="text-sm font-medium text-[color:var(--editorial-ink)]">Status da página</span>
						<div className="mt-3 grid gap-3 md:grid-cols-2">
							<label className="flex items-start gap-3 rounded-none border border-[color:var(--editorial-border)] bg-white/60 px-4 py-4 text-sm">
								<input
									type="radio"
									name="published"
									value="true"
									defaultChecked={base.published}
									className="mt-0.5"
								/>
								<span className="space-y-1">
									<span className="block font-medium text-[color:var(--editorial-ink)]">Publicado</span>
									<span className="block text-xs leading-5 text-[color:var(--editorial-muted)]">
										Usa esta copy na rota pública assim que a página for revalidada.
									</span>
								</span>
							</label>
							<label className="flex items-start gap-3 rounded-none border border-[color:var(--editorial-border)] bg-white/60 px-4 py-4 text-sm">
								<input
									type="radio"
									name="published"
									value="false"
									defaultChecked={!base.published}
									className="mt-0.5"
								/>
								<span className="space-y-1">
									<span className="block font-medium text-[color:var(--editorial-ink)]">Rascunho</span>
									<span className="block text-xs leading-5 text-[color:var(--editorial-muted)]">
										Mantém o conteúdo salvo no admin sem publicar esta versão na vitrine.
									</span>
								</span>
							</label>
						</div>
					</div>
				</CardContent>
			</Card>

			{sections.map((section) => (
				<Card key={section.title} className="rounded-none border-[color:var(--editorial-border)] p-0">
					<details open={section.defaultOpen ?? false} className="group">
						<summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5">
							<div className="space-y-2">
								<CardTitle className="text-xl text-[color:var(--editorial-ink)]">{section.title}</CardTitle>
								{section.description ? (
									<p className="max-w-2xl text-sm leading-6 text-[color:var(--editorial-muted)]">
										{section.description}
									</p>
								) : null}
							</div>
							<span className="pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-muted)] group-open:hidden">
								Expandir
							</span>
							<span className="hidden pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-muted)] group-open:block">
								Recolher
							</span>
						</summary>
						<CardContent className="grid gap-4 border-t border-[color:var(--editorial-border)] px-6 py-6 md:grid-cols-2">
							{section.fields.map((field) => (
								<div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : undefined}>
									<Field field={{ ...field, route: field.route ?? section.route }} />
								</div>
							))}
						</CardContent>
					</details>
				</Card>
			))}

			{state.status === "success" && state.message ? (
				<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-ink)]">
					<p className="font-medium">{state.message}</p>
					{savedAtLabel ? (
						<p className="mt-1 text-xs leading-5 text-[color:var(--editorial-muted)]">
							Último salvamento: {savedAtLabel}.
						</p>
					) : null}
				</div>
			) : null}

			<EditorialFloatingSaveBar hint="Salvar alteracoes desta pagina.">
				{submitLabel}
			</EditorialFloatingSaveBar>
		</form>
	);
}
