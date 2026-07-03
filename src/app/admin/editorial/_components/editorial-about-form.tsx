import type { ReactNode } from "react";
import { EditorialFloatingSaveBar } from "@/app/admin/editorial/_components/editorial-floating-save-bar";
import { AdminImageUrlList } from "@/app/admin/products/_components/admin-image-url-list.client";
import type { EditorialAboutPage } from "@/lib/editorial-content";
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

export function EditorialAboutForm({
	action,
	page,
	submitLabel,
}: {
	action: (formData: FormData) => void | Promise<void>;
	page: EditorialAboutPage;
	submitLabel: string;
}) {
	const cards = page.cards ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Editar página sobre</CardTitle>
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
						</div>
					</section>

					<section className="space-y-4 rounded-lg border p-5">
						<h2 className="text-base font-semibold">Bloco principal</h2>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Eyebrow" name="sectionEyebrow">
								<Input id="sectionEyebrow" name="sectionEyebrow" defaultValue={page.section?.eyebrow ?? ""} />
							</Field>
							<Field label="Título" name="sectionTitle">
								<Input id="sectionTitle" name="sectionTitle" defaultValue={page.section?.title ?? ""} />
							</Field>
							<div className="md:col-span-2">
								<Field label="Texto" name="sectionBody">
									<Textarea name="sectionBody" defaultValue={page.section?.body ?? ""} rows={5} />
								</Field>
							</div>
							<div className="md:col-span-2">
								<Field label="Texto estendido" name="sectionExtended">
									<Textarea name="sectionExtended" defaultValue={page.section?.extended ?? ""} rows={4} />
								</Field>
							</div>
							<Field label="CTA principal · rótulo" name="sectionPrimaryCtaLabel">
								<Input
									id="sectionPrimaryCtaLabel"
									name="sectionPrimaryCtaLabel"
									defaultValue={page.section?.primaryCtaLabel ?? ""}
								/>
							</Field>
							<Field label="CTA principal · link" name="sectionPrimaryCtaHref">
								<Input
									id="sectionPrimaryCtaHref"
									name="sectionPrimaryCtaHref"
									defaultValue={page.section?.primaryCtaHref ?? ""}
								/>
							</Field>
						</div>
						<Field label="Imagem" name="sectionImageSrc">
							<AdminImageUrlList
								name="sectionImageSrc"
								initialValues={page.section?.image?.src ? [page.section.image.src] : []}
								uploadMode="on-submit"
							/>
						</Field>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Alt da imagem" name="sectionImageAlt">
								<Input
									id="sectionImageAlt"
									name="sectionImageAlt"
									defaultValue={page.section?.image?.alt ?? ""}
								/>
							</Field>
							<Field label="Legenda da imagem" name="sectionImageCaption">
								<Input
									id="sectionImageCaption"
									name="sectionImageCaption"
									defaultValue={page.section?.image?.caption ?? ""}
								/>
							</Field>
						</div>
					</section>

					<section className="grid gap-4 rounded-lg border p-5">
						<h2 className="text-base font-semibold">Cards centrais</h2>
						{[1, 2, 3].map((index) => (
							<div key={index} className="grid gap-4 rounded-lg border p-4">
								<Field label={`Card ${index} · eyebrow`} name={`card${index}Eyebrow`}>
									<Input
										id={`card${index}Eyebrow`}
										name={`card${index}Eyebrow`}
										defaultValue={cards[index - 1]?.eyebrow ?? ""}
									/>
								</Field>
								<Field label={`Card ${index} · título`} name={`card${index}Title`}>
									<Input
										id={`card${index}Title`}
										name={`card${index}Title`}
										defaultValue={cards[index - 1]?.title ?? ""}
									/>
								</Field>
								<Field label={`Card ${index} · texto`} name={`card${index}Body`}>
									<Textarea name={`card${index}Body`} defaultValue={cards[index - 1]?.body ?? ""} rows={4} />
								</Field>
							</div>
						))}
					</section>

					<section className="grid gap-4 rounded-lg border p-5">
						<h2 className="text-base font-semibold">Fechamento</h2>
						<Field label="Eyebrow" name="closingEyebrow">
							<Input id="closingEyebrow" name="closingEyebrow" defaultValue={page.closing?.eyebrow ?? ""} />
						</Field>
						<Field label="Título" name="closingTitle">
							<Input id="closingTitle" name="closingTitle" defaultValue={page.closing?.title ?? ""} />
						</Field>
						<Field label="Texto" name="closingBody">
							<Textarea name="closingBody" defaultValue={page.closing?.body ?? ""} rows={4} />
						</Field>
						<Field label="Princípio · eyebrow" name="coreEyebrow">
							<Input id="coreEyebrow" name="coreEyebrow" defaultValue={page.closing?.coreEyebrow ?? ""} />
						</Field>
						<Field label="Princípio · título" name="coreTitle">
							<Textarea name="coreTitle" defaultValue={page.closing?.coreTitle ?? ""} rows={3} />
						</Field>
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

					<EditorialFloatingSaveBar hint="Salvar alteracoes da pagina sobre.">
						{submitLabel}
					</EditorialFloatingSaveBar>
				</form>
			</CardContent>
		</Card>
	);
}
