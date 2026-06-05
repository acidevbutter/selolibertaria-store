import { AdminImageUrlList } from "@/app/admin/products/_components/admin-image-url-list.client";
import type { EditorialSarauPage } from "@/lib/editorial-content";
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

function Field({ label, name, children }: { label: string; name: string; children: React.ReactNode }) {
	return (
		<div className="space-y-2">
			<Label htmlFor={name}>{label}</Label>
			{children}
		</div>
	);
}

function NoteFields({ index, title, body }: { index: number; title?: string | null; body?: string | null }) {
	return (
		<div className="grid gap-4 rounded-lg border p-4">
			<Field label={`Bloco ${index} · título`} name={`note${index}Title`}>
				<Input id={`note${index}Title`} name={`note${index}Title`} defaultValue={title ?? ""} />
			</Field>
			<Field label={`Bloco ${index} · texto`} name={`note${index}Body`}>
				<Textarea name={`note${index}Body`} defaultValue={body ?? ""} rows={4} />
			</Field>
		</div>
	);
}

export function EditorialSarauForm({
	action,
	page,
	submitLabel,
}: {
	action: (formData: FormData) => void | Promise<void>;
	page: EditorialSarauPage;
	submitLabel: string;
}) {
	const notes = page.programNotes ?? [];
	const signals = page.signals ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Editar Sarau Safado</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={action} className="space-y-6">
					<section className="grid gap-4 rounded-lg border p-5 md:grid-cols-2">
						<Field label="Título interno" name="title">
							<Input id="title" name="title" defaultValue={page.title} required />
						</Field>
						<Field label="Ordem" name="order">
							<Input
								id="order"
								name="order"
								type="number"
								min="1"
								step="1"
								defaultValue={String(page.order ?? 1)}
							/>
						</Field>
						<div className="md:col-span-2">
							<Field label="Resumo" name="summary">
								<Textarea name="summary" defaultValue={page.summary} rows={3} />
							</Field>
						</div>
						<div className="md:col-span-2">
							<Field label="Corpo principal" name="body">
								<Textarea name="body" defaultValue={page.body} rows={5} />
							</Field>
						</div>
					</section>

					<section className="space-y-4 rounded-lg border p-5">
						<div className="space-y-1">
							<h2 className="text-base font-semibold">Hero</h2>
							<p className="text-sm text-muted-foreground">
								Controla a abertura principal da página pública do Sarau Safado.
							</p>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Eyebrow" name="heroEyebrow">
								<Input id="heroEyebrow" name="heroEyebrow" defaultValue={page.hero?.eyebrow ?? ""} />
							</Field>
							<Field label="Título do hero" name="heroTitle">
								<Input id="heroTitle" name="heroTitle" defaultValue={page.hero?.title ?? ""} />
							</Field>
							<div className="md:col-span-2">
								<Field label="Texto do hero" name="heroBody">
									<Textarea name="heroBody" defaultValue={page.hero?.body ?? ""} rows={4} />
								</Field>
							</div>
						</div>
						<Field label="Upload" name="heroImageSrc">
							<AdminImageUrlList
								name="heroImageSrc"
								initialValues={page.hero?.image?.src ? [page.hero.image.src] : []}
								uploadMode="on-submit"
							/>
						</Field>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Alt da imagem" name="heroImageAlt">
								<Input id="heroImageAlt" name="heroImageAlt" defaultValue={page.hero?.image?.alt ?? ""} />
							</Field>
							<Field label="Legenda da imagem" name="heroImageCaption">
								<Input
									id="heroImageCaption"
									name="heroImageCaption"
									defaultValue={page.hero?.image?.caption ?? ""}
								/>
							</Field>
						</div>
					</section>

					<section className="grid gap-4 rounded-lg border p-5">
						<div className="space-y-1">
							<h2 className="text-base font-semibold">Bloco principal</h2>
							<p className="text-sm text-muted-foreground">
								Esse conteúdo alimenta a leitura institucional logo abaixo do hero.
							</p>
						</div>
						<Field label="Título do bloco" name="whyTitle">
							<Input id="whyTitle" name="whyTitle" defaultValue={page.why?.title ?? ""} />
						</Field>
						<Field label="Texto do bloco" name="whyBody">
							<Textarea name="whyBody" defaultValue={page.why?.body ?? ""} rows={4} />
						</Field>
					</section>

					<section className="grid gap-4 rounded-lg border p-5">
						<div className="space-y-1">
							<h2 className="text-base font-semibold">Sinais curatoriais</h2>
							<p className="text-sm text-muted-foreground">
								Use frases curtas. Os itens vazios são ignorados na página pública.
							</p>
						</div>
						{[0, 1, 2].map((index) => (
							<Field key={`signal-${index + 1}`} label={`Sinal ${index + 1}`} name="signals">
								<Input name="signals" defaultValue={signals[index] ?? ""} />
							</Field>
						))}
					</section>

					<section className="grid gap-4 rounded-lg border p-5">
						<div className="space-y-1">
							<h2 className="text-base font-semibold">Blocos editoriais</h2>
							<p className="text-sm text-muted-foreground">
								Esses cards aparecem na parte intermediária da página pública.
							</p>
						</div>
						<NoteFields index={1} title={notes[0]?.title} body={notes[0]?.body} />
						<NoteFields index={2} title={notes[1]?.title} body={notes[1]?.body} />
						<NoteFields index={3} title={notes[2]?.title} body={notes[2]?.body} />
					</section>

					<section className="rounded-lg border p-5">
						<div className="grid gap-3 md:grid-cols-2">
							<label className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm">
								<input
									type="radio"
									name="published"
									value="true"
									defaultChecked={page.published}
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
									defaultChecked={!page.published}
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
