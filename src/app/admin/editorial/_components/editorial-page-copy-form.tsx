"use client";

import { useActionState } from "react";
import { EditorialAccordionSection } from "@/app/admin/editorial/_components/editorial-accordion-section";
import { EditorialFloatingSaveBar } from "@/app/admin/editorial/_components/editorial-floating-save-bar";
import { EditorialHrefField } from "@/app/admin/editorial/_components/editorial-href-field";
import { EditorialTextEditor } from "@/app/admin/editorial/_components/editorial-text-editor.client";
import type { PageCopyActionState } from "@/app/admin/editorial/page-content-actions";
import { AdminImageUrlList } from "@/app/admin/products/_components/admin-image-url-list.client";
import type { EditorialBackground } from "@/lib/editorial-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";

type FieldType = "text" | "textarea" | "background";

type FieldConfig = {
	name: string;
	label: string;
	help?: string;
	route?: string;
	type?: FieldType;
	rows?: number;
	defaultValue?: string | null;
	background?: EditorialBackground | null;
};

type SectionConfig = {
	title: string;
	description?: string;
	route: string;
	tools?: string[];
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
	return <EditorialTextEditor name={name} defaultValue={defaultValue} rows={rows} />;
}

function BackgroundField({ field }: { field: FieldConfig }) {
	const background = field.background ?? null;
	const image = background?.image ?? null;

	return (
		<div className="grid gap-4 rounded-none border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-4 md:col-span-2">
			<div className="space-y-1">
				<p className="text-sm font-medium text-[color:var(--editorial-ink)]">{field.label}</p>
				<p className="text-xs leading-5 text-[color:var(--editorial-muted)]">
					Use uma imagem por bloco, com opções fechadas de preenchimento, posição, escurecimento e contraste.
				</p>
			</div>
			<AdminImageUrlList
				name={`${field.name}Src`}
				initialValues={image?.src ? [image.src] : []}
				uploadMode="on-submit"
				maxItems={1}
			/>
			<div className="grid gap-4 md:grid-cols-2">
				<label className="grid gap-2">
					<span className="text-sm font-medium text-[color:var(--editorial-ink)]">Texto alternativo</span>
					<Input name={`${field.name}Alt`} defaultValue={image?.alt ?? ""} />
				</label>
				<label className="grid gap-2">
					<span className="text-sm font-medium text-[color:var(--editorial-ink)]">Legenda</span>
					<Input name={`${field.name}Caption`} defaultValue={image?.caption ?? ""} />
				</label>
				<label className="grid gap-2">
					<span className="text-sm font-medium text-[color:var(--editorial-ink)]">Enquadramento</span>
					<select
						name={`${field.name}Fit`}
						defaultValue={background?.fit ?? "cover"}
						className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="cover">Preencher todo o fundo</option>
						<option value="contain">Mostrar a imagem inteira</option>
					</select>
				</label>
				<label className="grid gap-2">
					<span className="text-sm font-medium text-[color:var(--editorial-ink)]">Posição</span>
					<select
						name={`${field.name}Position`}
						defaultValue={background?.position ?? "center"}
						className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="center">Centro</option>
						<option value="top">Topo</option>
						<option value="bottom">Base</option>
						<option value="left">Esquerda</option>
						<option value="right">Direita</option>
					</select>
				</label>
				<label className="grid gap-2">
					<span className="text-sm font-medium text-[color:var(--editorial-ink)]">
						Escurecimento sobre a imagem
					</span>
					<select
						name={`${field.name}Escurecimento sobre a imagem`}
						defaultValue={background?.overlay ?? "medium"}
						className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="none">Sem escurecimento</option>
						<option value="soft">Suave</option>
						<option value="medium">Médio</option>
						<option value="strong">Forte</option>
					</select>
				</label>
				<label className="grid gap-2">
					<span className="text-sm font-medium text-[color:var(--editorial-ink)]">Contraste</span>
					<select
						name={`${field.name}Contrast`}
						defaultValue={background?.contrast ?? "light"}
						className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="light">Texto claro</option>
						<option value="dark">Texto escuro</option>
					</select>
				</label>
			</div>
		</div>
	);
}

function Field({ field }: { field: FieldConfig }) {
	if (field.type === "background") {
		return <BackgroundField field={field} />;
	}

	if (field.name.endsWith("Href")) {
		return <EditorialHrefField label={field.label} name={field.name} defaultValue={field.defaultValue} />;
	}

	return (
		<label className="grid gap-2">
			<span className="text-sm font-medium text-[color:var(--editorial-ink)]">{field.label}</span>
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
						Este bloco só controla se a versão salva já deve aparecer na rota pública. Os textos e botoes
						abaixo continuam sendo a fonte principal da página.
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
				<EditorialAccordionSection
					key={section.title}
					title={section.title}
					description={section.description}
					defaultOpen={section.defaultOpen ?? false}
					contentClassName="grid gap-4 px-6 py-6 md:grid-cols-2"
				>
					{section.tools?.length ? (
						<div className="flex flex-wrap gap-2 md:col-span-2">
							{section.tools?.map((tool) => (
								<span
									key={tool}
									className="border border-[color:var(--editorial-border)] bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--editorial-accent)]"
								>
									{tool}
								</span>
							))}
						</div>
					) : null}
					{section.fields.map((field) => (
						<div
							key={field.name}
							className={
								field.type === "textarea" || field.type === "background" ? "md:col-span-2" : undefined
							}
						>
							<Field field={field} />
						</div>
					))}
				</EditorialAccordionSection>
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

			<EditorialFloatingSaveBar hint="Salvar alterações desta página.">
				{submitLabel}
			</EditorialFloatingSaveBar>
		</form>
	);
}
