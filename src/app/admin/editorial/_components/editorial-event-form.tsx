import { AdminImageUrlList } from "@/app/admin/products/_components/admin-image-url-list.client";
import type { EditorialEvent } from "@/lib/editorial-content";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";

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
			id={name}
			name={name}
			defaultValue={defaultValue ?? ""}
			rows={rows}
			className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
		/>
	);
}

function Field({
	label,
	name,
	children,
	hint,
}: {
	label: string;
	name: string;
	children: React.ReactNode;
	hint?: string;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={name}>{label}</Label>
			{children}
			{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
		</div>
	);
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

					<section className="grid gap-4 rounded-lg border p-5 md:grid-cols-2">
						<Field label="Título" name="title">
							<Input id="title" name="title" defaultValue={event?.title ?? ""} required />
						</Field>
						<Field label="Slug" name="slug" hint="Se vazio, será gerado a partir do título.">
							<Input id="slug" name="slug" defaultValue={event?.slug ?? ""} />
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
					</section>

					<section className="space-y-4 rounded-lg border p-5">
						<div className="space-y-1">
							<h2 className="text-base font-semibold">Imagem principal</h2>
							<p className="text-sm text-muted-foreground">
								Use o mesmo fluxo de upload dos produtos para enviar a imagem do evento.
							</p>
						</div>
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
					</section>

					<section className="rounded-lg border p-5">
						<div className="grid gap-3 md:grid-cols-2">
							<label className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm">
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
										O evento pode aparecer como fonte primária no selolibertaria.
									</span>
								</span>
							</label>
							<label className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm">
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
					</section>

					<Button type="submit">{submitLabel}</Button>
				</form>
			</CardContent>
		</Card>
	);
}
