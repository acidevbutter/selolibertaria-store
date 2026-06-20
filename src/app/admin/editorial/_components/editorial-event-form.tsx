import { AdminImageUrlList } from "@/app/admin/products/_components/admin-image-url-list.client";
import {
	Field,
	FormSection,
	SubmitButton,
	Textarea,
} from "@/app/admin/products/_components/product-form-fields";
import type { EditorialEvent } from "@/lib/editorial-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";

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

function handleSlugInput(event: React.FormEvent<HTMLInputElement>) {
	event.currentTarget.value = formatSlugWhileTyping(event.currentTarget.value);
}

function handleSlugBlur(event: React.FocusEvent<HTMLInputElement>) {
	event.currentTarget.value = formatSlugToKebab(event.currentTarget.value);
}

export function EditorialEventForm({
	action,
	event,
	submitLabel,
}: {
	action: (formData: FormData) => void | Promise<void>;
	event?: EditorialEvent | null;
	submitLabel: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{event ? "Editar evento" : "Novo evento"}</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={action} className="space-y-6">
					{event ? <input type="hidden" name="currentSlug" value={event.slug} /> : null}

					<FormSection
						title="Identidade e agenda"
						description="Defina título, contexto de exibição, ordem e leitura curta do evento."
					>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Título" name="title">
								<Input id="title" name="title" defaultValue={event?.title ?? ""} required />
							</Field>
							<Field label="Slug" name="slug" hint="Se vazio, será gerado a partir do título.">
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
							<Field label="Status" name="status">
								<Input id="status" name="status" defaultValue={event?.status ?? ""} placeholder="em curso" />
							</Field>
							<Field label="Ordem" name="order">
								<Input
									id="order"
									name="order"
									type="number"
									min="1"
									step="1"
									defaultValue={String(event?.order ?? 1)}
								/>
							</Field>
							<Field label="Período" name="period">
								<Input id="period" name="period" defaultValue={event?.period ?? ""} />
							</Field>
							<Field label="Local" name="location">
								<Input id="location" name="location" defaultValue={event?.location ?? ""} />
							</Field>
							<div className="md:col-span-2">
								<Field label="Resumo" name="summary">
									<Textarea name="summary" defaultValue={event?.summary} rows={3} />
								</Field>
							</div>
							<div className="md:col-span-2">
								<Field label="Descrição" name="description">
									<Textarea name="description" defaultValue={event?.description} rows={5} />
								</Field>
							</div>
						</div>
					</FormSection>

					<FormSection
						title="Imagem principal"
						description="Use o mesmo fluxo de upload dos produtos para revisar a mídia antes de salvá-la no evento."
					>
						<Field label="Upload" name="imageSrc">
							<AdminImageUrlList
								name="imageSrc"
								initialValues={event?.image?.src ? [event.image.src] : []}
								uploadMode="on-submit"
							/>
						</Field>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Alt da imagem" name="imageAlt">
								<Input id="imageAlt" name="imageAlt" defaultValue={event?.image?.alt ?? ""} />
							</Field>
							<Field label="Legenda da imagem" name="imageCaption">
								<Input id="imageCaption" name="imageCaption" defaultValue={event?.image?.caption ?? ""} />
							</Field>
						</div>
					</FormSection>

					<FormSection
						title="Publicação"
						description="Escolha se a edição deve assumir imediatamente a vitrine pública principal ou permanecer em rascunho."
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
										O evento pode aparecer como fonte primária na área pública.
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
										Mantém salvo no Mongo sem virar a fonte pública principal.
									</span>
								</span>
							</label>
						</div>
					</FormSection>

					<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-xs leading-6 text-[color:var(--editorial-muted)]">
						A prévia da imagem fica vinculada ao formulário e o envio definitivo acontece quando você salvar
						esta página.
					</div>
					<SubmitButton>{submitLabel}</SubmitButton>
				</form>
			</CardContent>
		</Card>
	);
}
