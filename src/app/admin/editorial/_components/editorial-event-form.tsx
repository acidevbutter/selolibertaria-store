"use client";

import { type FocusEvent, type FormEvent, useActionState } from "react";
import { EditorialAccordionSection } from "@/app/admin/editorial/_components/editorial-accordion-section";
import { EditorialFloatingSaveBar } from "@/app/admin/editorial/_components/editorial-floating-save-bar";
import { EditorialTextEditor } from "@/app/admin/editorial/_components/editorial-text-editor.client";
import type { EditorialItemFormActionState } from "@/app/admin/editorial/actions";
import { AdminImageUrlList } from "@/app/admin/products/_components/admin-image-url-list.client";
import { Field } from "@/app/admin/products/_components/product-form-fields";
import type { EditorialEvent } from "@/lib/editorial-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";

const INITIAL_EDITORIAL_ITEM_FORM_STATE: EditorialItemFormActionState = {
	status: "idle",
	message: null,
	fieldErrors: {},
};

function formatSlugToKebab(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function formatSlugWhileTyping(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+/, "");
}

function handleSlugInput(event: FormEvent<HTMLInputElement>) {
	event.currentTarget.value = formatSlugWhileTyping(event.currentTarget.value);
}

function handleSlugBlur(event: FocusEvent<HTMLInputElement>) {
	event.currentTarget.value = formatSlugToKebab(event.currentTarget.value);
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

export function EditorialEventForm({
	action,
	event,
	submitLabel,
}: {
	action: (
		state: EditorialItemFormActionState,
		formData: FormData,
	) => EditorialItemFormActionState | Promise<EditorialItemFormActionState>;
	event?: EditorialEvent | null;
	submitLabel: string;
}) {
	const [state, formAction] = useActionState(action, INITIAL_EDITORIAL_ITEM_FORM_STATE);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{event ? "Editar evento" : "Novo evento"}</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={formAction} className="space-y-6 pb-28 md:pb-32">
					{event ? <input type="hidden" name="currentSlug" value={event.slug} /> : null}

					<EditorialAccordionSection
						title="Identidade e agenda"
						description="Defina título, status, ordem e resumo do evento."
						defaultOpen
						contentClassName="grid gap-4 px-5 py-5"
					>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Título do evento" name="title">
								<Input
									id="title"
									name="title"
									defaultValue={event?.title ?? ""}
									aria-invalid={Boolean(state.fieldErrors.title)}
									required
								/>
								{state.fieldErrors.title ? (
									<p className="text-xs text-destructive">{state.fieldErrors.title}</p>
								) : null}
							</Field>
							<Field
								label="Endereço público do evento"
								name="slug"
								hint="Use uma versão curta do endereço público. Se vazio, será gerado a partir do título."
							>
								<Input
									id="slug"
									name="slug"
									defaultValue={event?.slug ?? ""}
									onInput={handleSlugInput}
									onBlur={handleSlugBlur}
									autoCapitalize="none"
									autoCorrect="off"
									spellCheck={false}
								/>
							</Field>
							<Field
								label="Status editorial"
								name="status"
								hint="Exemplo: Em curso, Confirmado ou Edição passada."
							>
								<Input id="status" name="status" defaultValue={event?.status ?? ""} placeholder="em curso" />
							</Field>
							<Field
								label="Ordem de exibição"
								name="order"
								hint="Números menores aparecem primeiro na agenda editorial."
							>
								<Input
									id="order"
									name="order"
									type="number"
									min="1"
									step="1"
									defaultValue={String(event?.order ?? 1)}
									aria-invalid={Boolean(state.fieldErrors.order)}
								/>
								{state.fieldErrors.order ? (
									<p className="text-xs text-destructive">{state.fieldErrors.order}</p>
								) : null}
							</Field>
							<Field
								label="Período exibido"
								name="period"
								hint="Exemplo: 12 de julho de 2026 ou Julho de 2026."
							>
								<Input id="period" name="period" defaultValue={event?.period ?? ""} />
							</Field>
							<Field
								label="Local exibido"
								name="location"
								hint="Informe cidade, espaço ou contexto curto do evento."
							>
								<Input id="location" name="location" defaultValue={event?.location ?? ""} />
							</Field>
							<div className="md:col-span-2">
								<Field label="Resumo curto do evento" name="summary">
									<Textarea name="summary" defaultValue={event?.summary} rows={3} />
								</Field>
							</div>
							<div className="md:col-span-2">
								<Field label="Descrição completa do evento" name="description">
									<Textarea name="description" defaultValue={event?.description} rows={5} />
								</Field>
							</div>
						</div>
					</EditorialAccordionSection>

					<EditorialAccordionSection
						title="Imagem do evento"
						description="Revise a imagem pública antes de salvar o evento."
						contentClassName="grid gap-4 px-5 py-5"
					>
						<Field label="Imagem principal do evento" name="imageSrc">
							<AdminImageUrlList
								name="imageSrc"
								initialValues={event?.image?.src ? [event.image.src] : []}
								uploadMode="on-submit"
								maxItems={1}
							/>
						</Field>
						<div className="grid gap-4 md:grid-cols-2">
							<Field
								label="Texto alternativo da imagem"
								name="imageAlt"
								hint="Descreva a imagem para leitura assistiva e contexto editorial."
							>
								<Input id="imageAlt" name="imageAlt" defaultValue={event?.image?.alt ?? ""} />
							</Field>
							<Field
								label="Legenda pública da imagem"
								name="imageCaption"
								hint="Use uma frase curta para contextualizar a foto no admin e no site."
							>
								<Input id="imageCaption" name="imageCaption" defaultValue={event?.image?.caption ?? ""} />
							</Field>
						</div>
					</EditorialAccordionSection>

					<EditorialAccordionSection
						title="Publicação"
						description="Escolha se o evento já deve aparecer no site ou ficar em rascunho."
						contentClassName="px-5 py-5"
					>
						<div className="grid gap-3 md:grid-cols-2">
							<label className="flex cursor-pointer items-start gap-3 border border-[color:var(--editorial-border)] bg-white/50 px-3 py-3 text-sm">
								<input
									type="radio"
									name="published"
									value="true"
									defaultChecked={event ? event.published : true}
									className="mt-0.5"
								/>
								<span className="space-y-1">
									<span className="block font-medium">Publicado</span>
									<span className="block text-xs text-muted-foreground">
										O evento já pode aparecer no site.
									</span>
								</span>
							</label>
							<label className="flex cursor-pointer items-start gap-3 border border-[color:var(--editorial-border)] bg-white/50 px-3 py-3 text-sm">
								<input
									type="radio"
									name="published"
									value="false"
									defaultChecked={event ? !event.published : false}
									className="mt-0.5"
								/>
								<span className="space-y-1">
									<span className="block font-medium">Rascunho</span>
									<span className="block text-xs text-muted-foreground">
										Mantém salvo sem publicar no site.
									</span>
								</span>
							</label>
						</div>
					</EditorialAccordionSection>

					<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-xs leading-6 text-[color:var(--editorial-muted)]">
						A imagem será enviada somente ao salvar o formulário. Até lá, a prévia fica pendente nesta página.
					</div>
					{state.status === "error" && state.message ? (
						<p role="alert" className="text-sm text-destructive">
							{state.message}
						</p>
					) : null}

					<EditorialFloatingSaveBar hint="Salvar alterações do evento.">
						{submitLabel}
					</EditorialFloatingSaveBar>
				</form>
			</CardContent>
		</Card>
	);
}
