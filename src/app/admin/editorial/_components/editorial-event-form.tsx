import { AdminImageUrlList } from "@/app/admin/products/_components/admin-image-url-list.client";
import { EditorialSlugInput } from "@/app/admin/editorial/_components/editorial-slug-input.client";
import {
	Field,
	FormSection,
	SubmitButton,
	Textarea,
} from "@/app/admin/products/_components/product-form-fields";
import type { EditorialEvent } from "@/lib/editorial-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";

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
						description="Defina título, status, ordem e resumo do evento."
					>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Título" name="title">
								<Input id="title" name="title" defaultValue={event?.title ?? ""} required />
							</Field>
							<Field label="Slug" name="slug" hint="Se vazio, será gerado a partir do título.">
								<EditorialSlugInput
									id="slug"
									name="slug"
									defaultValue={event?.slug ?? ""}
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

					<FormSection title="Imagem principal" description="Revise a imagem antes de salvar o evento.">
						<Field label="Imagem" name="imageSrc">
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
						description="Escolha se o evento já deve aparecer no site ou ficar em rascunho."
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
					</FormSection>

					<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-xs leading-6 text-[color:var(--editorial-muted)]">
						A prévia da imagem fica no formulário e o envio definitivo acontece ao salvar esta página.
					</div>
					<SubmitButton>{submitLabel}</SubmitButton>
				</form>
			</CardContent>
		</Card>
	);
}
