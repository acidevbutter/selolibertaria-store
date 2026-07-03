import type { ReactNode } from "react";
import { EditorialFloatingSaveBar } from "@/app/admin/editorial/_components/editorial-floating-save-bar";
import type { EditorialContactPage } from "@/lib/editorial-content";
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

function Field({ label, name, children }: { label: string; name: string; children: ReactNode }) {
	return (
		<div className="space-y-2">
			<Label htmlFor={name}>{label}</Label>
			{children}
		</div>
	);
}

export function EditorialContactForm({
	action,
	page,
	submitLabel,
}: {
	action: (formData: FormData) => void | Promise<void>;
	page: EditorialContactPage;
	submitLabel: string;
}) {
	const directLinks = page.direct?.links ?? [];
	const pathLinks = page.paths?.links ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Editar página de contato</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={action} className="space-y-6 pb-28 md:pb-32">
					<section className="grid gap-4 rounded-lg border p-5">
						<h2 className="text-base font-semibold">Hero</h2>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Eyebrow" name="heroEyebrow">
								<Input id="heroEyebrow" name="heroEyebrow" defaultValue={page.hero?.eyebrow ?? ""} />
							</Field>
							<Field label="Título" name="heroTitle">
								<Input id="heroTitle" name="heroTitle" defaultValue={page.hero?.title ?? ""} />
							</Field>
							<div className="md:col-span-2">
								<Field label="Texto" name="heroBody">
									<Textarea name="heroBody" defaultValue={page.hero?.body ?? ""} rows={4} />
								</Field>
							</div>
							<Field label="Destaque lateral · rótulo" name="heroFeaturedLabel">
								<Input
									id="heroFeaturedLabel"
									name="heroFeaturedLabel"
									defaultValue={page.hero?.featuredLabel ?? ""}
								/>
							</Field>
							<Field label="Destaque lateral · valor" name="heroFeaturedValue">
								<Input
									id="heroFeaturedValue"
									name="heroFeaturedValue"
									defaultValue={page.hero?.featuredValue ?? ""}
								/>
							</Field>
						</div>
					</section>

					<section className="grid gap-4 rounded-lg border p-5">
						<h2 className="text-base font-semibold">Formulário</h2>
						<Field label="Título do bloco" name="formTitle">
							<Input id="formTitle" name="formTitle" defaultValue={page.form?.title ?? ""} />
						</Field>
						<Field label="Descrição do bloco" name="formDescription">
							<Textarea name="formDescription" defaultValue={page.form?.description ?? ""} rows={3} />
						</Field>
						{[1, 2, 3, 4, 5, 6].map((index) => (
							<Field key={index} label={`Assunto ${index}`} name={`subject${index}`}>
								<Input
									id={`subject${index}`}
									name={`subject${index}`}
									defaultValue={page.form?.subjects?.[index - 1] ?? ""}
								/>
							</Field>
						))}
					</section>

					<section className="grid gap-4 rounded-lg border p-5">
						<h2 className="text-base font-semibold">Canais diretos</h2>
						<Field label="Título do bloco" name="directTitle">
							<Input id="directTitle" name="directTitle" defaultValue={page.direct?.title ?? ""} />
						</Field>
						<Field label="Descrição do bloco" name="directDescription">
							<Textarea name="directDescription" defaultValue={page.direct?.description ?? ""} rows={3} />
						</Field>
						{[1, 2, 3].map((index) => (
							<div key={index} className="grid gap-4 rounded-lg border p-4 md:grid-cols-3">
								<Field label={`Canal ${index} · rótulo`} name={`direct${index}Label`}>
									<Input
										id={`direct${index}Label`}
										name={`direct${index}Label`}
										defaultValue={directLinks[index - 1]?.label ?? ""}
									/>
								</Field>
								<Field label={`Canal ${index} · texto`} name={`direct${index}Text`}>
									<Input
										id={`direct${index}Text`}
										name={`direct${index}Text`}
										defaultValue={directLinks[index - 1]?.text ?? ""}
									/>
								</Field>
								<Field label={`Canal ${index} · link`} name={`direct${index}Href`}>
									<Input
										id={`direct${index}Href`}
										name={`direct${index}Href`}
										defaultValue={directLinks[index - 1]?.href ?? ""}
									/>
								</Field>
							</div>
						))}
					</section>

					<section className="grid gap-4 rounded-lg border p-5">
						<h2 className="text-base font-semibold">Caminhos comuns</h2>
						<Field label="Título da faixa final" name="closingTitle">
							<Input id="closingTitle" name="closingTitle" defaultValue={page.closing?.title ?? ""} />
						</Field>
						<Field label="Título do bloco" name="pathsTitle">
							<Input id="pathsTitle" name="pathsTitle" defaultValue={page.paths?.title ?? ""} />
						</Field>
						<Field label="Descrição do bloco" name="pathsDescription">
							<Textarea name="pathsDescription" defaultValue={page.paths?.description ?? ""} rows={3} />
						</Field>
						{[1, 2, 3, 4, 5, 6].map((index) => (
							<div key={index} className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
								<Field label={`Link ${index} · rótulo`} name={`path${index}Label`}>
									<Input
										id={`path${index}Label`}
										name={`path${index}Label`}
										defaultValue={pathLinks[index - 1]?.label ?? ""}
									/>
								</Field>
								<Field label={`Link ${index} · href`} name={`path${index}Href`}>
									<Input
										id={`path${index}Href`}
										name={`path${index}Href`}
										defaultValue={pathLinks[index - 1]?.href ?? ""}
									/>
								</Field>
							</div>
						))}
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
								<span className="block font-medium">Publicado</span>
							</label>
							<label className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm">
								<input
									type="radio"
									name="published"
									value="false"
									defaultChecked={!page.published}
									className="mt-0.5"
								/>
								<span className="block font-medium">Rascunho</span>
							</label>
						</div>
					</section>

					<EditorialFloatingSaveBar hint="Salvar alteracoes da pagina de contato.">
						{submitLabel}
					</EditorialFloatingSaveBar>
				</form>
			</CardContent>
		</Card>
	);
}
