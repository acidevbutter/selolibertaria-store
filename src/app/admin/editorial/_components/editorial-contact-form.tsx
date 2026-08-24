import type { ReactNode } from "react";
import { EditorialAccordionSection } from "@/app/admin/editorial/_components/editorial-accordion-section";
import { EditorialFloatingSaveBar } from "@/app/admin/editorial/_components/editorial-floating-save-bar";
import { EditorialHrefField } from "@/app/admin/editorial/_components/editorial-href-field";
import { EditorialTextEditor } from "@/app/admin/editorial/_components/editorial-text-editor.client";
import type { EditorialContactPage } from "@/lib/editorial-content";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
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
	return <EditorialTextEditor name={name} defaultValue={defaultValue} rows={rows} />;
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
	const pathLinks = page.paths?.links ?? [];
	const fixedDirectLinks = [
		{ label: "Email", text: seloSiteMeta.email },
		{ label: "Instagram", text: "@selolibertaria" },
		{ label: "YouTube", text: "Selo Libertária" },
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Editar página de contato</CardTitle>
			</CardHeader>
			<CardContent>
				<form id="editorial-contact-form" action={action} className="space-y-6 pb-28 md:pb-32">
					<EditorialAccordionSection
						title="Abertura da página"
						defaultOpen
						contentClassName="grid gap-4 px-5 py-5"
					>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Chamada curta acima do título" name="heroEyebrow">
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
					</EditorialAccordionSection>

					<EditorialAccordionSection title="Formulário" contentClassName="grid gap-4 px-5 py-5">
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
					</EditorialAccordionSection>

					<EditorialAccordionSection title="Canais diretos" contentClassName="grid gap-4 px-5 py-5">
						<Field label="Título do bloco" name="directTitle">
							<Input id="directTitle" name="directTitle" defaultValue={page.direct?.title ?? ""} />
						</Field>
						<Field label="Descrição do bloco" name="directDescription">
							<Textarea name="directDescription" defaultValue={page.direct?.description ?? ""} rows={3} />
						</Field>
						<div className="grid gap-3 rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
							<p>
								Os canais oficiais ficam fixos fora do editor para evitar publicação acidental de dados de
								contato incorretos.
							</p>
							<ul className="grid gap-2">
								{fixedDirectLinks.map((link) => (
									<li key={link.label} className="flex flex-wrap gap-2">
										<span className="font-medium text-foreground">{link.label}:</span>
										<span>{link.text}</span>
									</li>
								))}
							</ul>
						</div>
					</EditorialAccordionSection>

					<EditorialAccordionSection title="Caminhos comuns" contentClassName="grid gap-4 px-5 py-5">
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
								<EditorialHrefField
									label={`Link ${index} · destino`}
									name={`path${index}Href`}
									defaultValue={pathLinks[index - 1]?.href}
								/>
							</div>
						))}
					</EditorialAccordionSection>

					<EditorialAccordionSection title="Publicação" contentClassName="px-5 py-5">
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
					</EditorialAccordionSection>

					<EditorialFloatingSaveBar hint="Salvar alterações da página de contato.">
						{submitLabel}
					</EditorialFloatingSaveBar>
				</form>
			</CardContent>
		</Card>
	);
}
