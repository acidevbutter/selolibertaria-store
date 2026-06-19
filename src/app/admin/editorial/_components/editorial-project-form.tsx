import { AdminImageUrlList } from "@/app/admin/products/_components/admin-image-url-list.client";
import type { EditorialProject } from "@/lib/editorial-content";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";

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

function Field({ label, name, children }: { label: string; name: string; children: React.ReactNode }) {
	return (
		<div className="space-y-2">
			<Label htmlFor={name}>{label}</Label>
			{children}
		</div>
	);
}

export function EditorialProjectForm({
	action,
	project,
	submitLabel,
}: {
	action: (formData: FormData) => void | Promise<void>;
	project?: EditorialProject | null;
	submitLabel: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{project ? "Editar projeto" : "Novo projeto"}</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={action} className="space-y-6">
					{project ? <input type="hidden" name="currentSlug" value={project.slug} /> : null}
					<section className="grid gap-4 rounded-lg border p-5 md:grid-cols-2">
						<Field label="Título" name="title">
							<Input id="title" name="title" defaultValue={project?.title ?? ""} required />
						</Field>
						<Field label="Slug" name="slug">
							<Input
								id="slug"
								name="slug"
								defaultValue={project?.slug ?? ""}
								onInput={handleSlugInput}
								onBlur={handleSlugBlur}
								autoCapitalize="none"
								autoCorrect="off"
								spellCheck={false}
							/>
						</Field>
						<Field label="Período" name="period">
							<Input id="period" name="period" defaultValue={project?.period ?? ""} />
						</Field>
						<Field label="Local" name="location">
							<Input id="location" name="location" defaultValue={project?.location ?? ""} />
						</Field>
						<Field label="Ordem" name="order">
							<Input
								id="order"
								name="order"
								type="number"
								min="1"
								step="1"
								defaultValue={String(project?.order ?? 1)}
							/>
						</Field>
						<div className="md:col-span-2">
							<Field label="Resumo" name="summary">
								<Textarea name="summary" defaultValue={project?.summary} rows={3} />
							</Field>
						</div>
						<div className="md:col-span-2">
							<Field label="Descrição" name="description">
								<Textarea name="description" defaultValue={project?.description} rows={5} />
							</Field>
						</div>
					</section>
					<section className="space-y-4 rounded-lg border p-5">
						<div className="space-y-1">
							<h2 className="text-base font-semibold">Imagem principal</h2>
						</div>
						<Field label="Upload" name="imageSrc">
							<AdminImageUrlList
								name="imageSrc"
								initialValues={project?.image?.src ? [project.image.src] : []}
								uploadMode="on-submit"
							/>
						</Field>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Alt da imagem" name="imageAlt">
								<Input id="imageAlt" name="imageAlt" defaultValue={project?.image?.alt ?? ""} />
							</Field>
							<Field label="Legenda da imagem" name="imageCaption">
								<Input id="imageCaption" name="imageCaption" defaultValue={project?.image?.caption ?? ""} />
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
									defaultChecked={project ? project.published : true}
									className="mt-0.5"
								/>
								<span className="space-y-1">
									<span className="block font-medium">Publicado</span>
								</span>
							</label>
							<label className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm">
								<input
									type="radio"
									name="published"
									value="false"
									defaultChecked={project ? !project.published : false}
									className="mt-0.5"
								/>
								<span className="space-y-1">
									<span className="block font-medium">Rascunho</span>
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
