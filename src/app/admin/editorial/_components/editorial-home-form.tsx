import { EditorialHrefField } from "@/app/admin/editorial/_components/editorial-href-field";
import { AdminImageUrlList } from "@/app/admin/products/_components/admin-image-url-list.client";
import type { EditorialBackground, EditorialHomePage } from "@/lib/editorial-content";
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

function BackgroundFields({
	name,
	label,
	background,
}: {
	name: string;
	label: string;
	background?: EditorialBackground | null;
}) {
	const image = background?.image ?? null;

	return (
		<div className="grid gap-4 rounded-lg border p-4 md:col-span-2">
			<Field label={label} name={`${name}Src`}>
				<AdminImageUrlList
					name={`${name}Src`}
					initialValues={image?.src ? [image.src] : []}
					uploadMode="on-submit"
					maxItems={1}
				/>
			</Field>
			<div className="grid gap-4 md:grid-cols-2">
				<Field label="Texto alternativo" name={`${name}Alt`}>
					<Input id={`${name}Alt`} name={`${name}Alt`} defaultValue={image?.alt ?? ""} />
				</Field>
				<Field label="Legenda" name={`${name}Caption`}>
					<Input id={`${name}Caption`} name={`${name}Caption`} defaultValue={image?.caption ?? ""} />
				</Field>
				<Field label="Enquadramento" name={`${name}Fit`}>
					<select
						id={`${name}Fit`}
						name={`${name}Fit`}
						defaultValue={background?.fit ?? "cover"}
						className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="cover">Cover</option>
						<option value="contain">Contain</option>
					</select>
				</Field>
				<Field label="Posição" name={`${name}Position`}>
					<select
						id={`${name}Position`}
						name={`${name}Position`}
						defaultValue={background?.position ?? "center"}
						className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="center">Centro</option>
						<option value="top">Topo</option>
						<option value="bottom">Base</option>
						<option value="left">Esquerda</option>
						<option value="right">Direita</option>
					</select>
				</Field>
				<Field label="Overlay" name={`${name}Overlay`}>
					<select
						id={`${name}Overlay`}
						name={`${name}Overlay`}
						defaultValue={background?.overlay ?? "medium"}
						className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="none">Sem overlay</option>
						<option value="soft">Suave</option>
						<option value="medium">Médio</option>
						<option value="strong">Forte</option>
					</select>
				</Field>
				<Field label="Contraste" name={`${name}Contrast`}>
					<select
						id={`${name}Contrast`}
						name={`${name}Contrast`}
						defaultValue={background?.contrast ?? "light"}
						className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="light">Texto claro</option>
						<option value="dark">Texto escuro</option>
					</select>
				</Field>
			</div>
		</div>
	);
}

export function EditorialHomeForm({
	action,
	page,
	submitLabel,
}: {
	action: (formData: FormData) => void | Promise<void>;
	page: EditorialHomePage;
	submitLabel: string;
}) {
	const communityLinks = page.community?.secondaryLinks ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Editar página inicial</CardTitle>
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
					</section>

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
								<Field label="Descrição" name="heroDescription">
									<Textarea name="heroDescription" defaultValue={page.hero?.description ?? ""} rows={4} />
								</Field>
							</div>
							<Field label="CTA principal · rótulo" name="heroPrimaryCtaLabel">
								<Input
									id="heroPrimaryCtaLabel"
									name="heroPrimaryCtaLabel"
									defaultValue={page.hero?.primaryCtaLabel ?? ""}
								/>
							</Field>
							<EditorialHrefField
								label="CTA principal · link"
								name="heroPrimaryCtaHref"
								defaultValue={page.hero?.primaryCtaHref}
							/>
							<Field label="CTA secundária · rótulo" name="heroSecondaryCtaLabel">
								<Input
									id="heroSecondaryCtaLabel"
									name="heroSecondaryCtaLabel"
									defaultValue={page.hero?.secondaryCtaLabel ?? ""}
								/>
							</Field>
							<EditorialHrefField
								label="CTA secundária · link"
								name="heroSecondaryCtaHref"
								defaultValue={page.hero?.secondaryCtaHref}
							/>
							<div className="md:col-span-2">
								<Field label="Linha de apoio" name="heroSupportingLine">
									<Textarea
										name="heroSupportingLine"
										defaultValue={page.hero?.supportingLine ?? ""}
										rows={2}
									/>
								</Field>
							</div>
						</div>
						<BackgroundFields
							name="heroBackground"
							label="Fundo do hero"
							background={page.hero?.background}
						/>
					</section>

					<section className="space-y-4 rounded-lg border p-5">
						<h2 className="text-base font-semibold">Bloco visual do hero</h2>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Eyebrow" name="heroFeatureEyebrow">
								<Input
									id="heroFeatureEyebrow"
									name="heroFeatureEyebrow"
									defaultValue={page.hero?.featureEyebrow ?? ""}
								/>
							</Field>
							<Field label="Título" name="heroFeatureTitle">
								<Input
									id="heroFeatureTitle"
									name="heroFeatureTitle"
									defaultValue={page.hero?.featureTitle ?? ""}
								/>
							</Field>
							<div className="md:col-span-2">
								<Field label="Texto" name="heroFeatureBody">
									<Textarea name="heroFeatureBody" defaultValue={page.hero?.featureBody ?? ""} rows={3} />
								</Field>
							</div>
							<div className="md:col-span-2">
								<Field label="Frase lateral" name="heroFeatureQuote">
									<Textarea name="heroFeatureQuote" defaultValue={page.hero?.featureQuote ?? ""} rows={2} />
								</Field>
							</div>
						</div>
						<Field label="Imagem de apoio do hero" name="heroFeatureImageSrc">
							<AdminImageUrlList
								name="heroFeatureImageSrc"
								initialValues={page.hero?.featureImage?.src ? [page.hero.featureImage.src] : []}
								uploadMode="on-submit"
								maxItems={1}
							/>
						</Field>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Texto alternativo da imagem de apoio" name="heroFeatureImageAlt">
								<Input
									id="heroFeatureImageAlt"
									name="heroFeatureImageAlt"
									defaultValue={page.hero?.featureImage?.alt ?? ""}
								/>
							</Field>
							<Field label="Legenda pública da imagem" name="heroFeatureImageCaption">
								<Input
									id="heroFeatureImageCaption"
									name="heroFeatureImageCaption"
									defaultValue={page.hero?.featureImage?.caption ?? ""}
								/>
							</Field>
						</div>
					</section>

					<section className="grid gap-4 rounded-lg border p-5">
						<h2 className="text-base font-semibold">Manifesto</h2>
						<Field label="Título" name="manifestoTitle">
							<Input id="manifestoTitle" name="manifestoTitle" defaultValue={page.manifesto?.title ?? ""} />
						</Field>
						<Field label="Texto" name="manifestoBody">
							<Textarea name="manifestoBody" defaultValue={page.manifesto?.body ?? ""} rows={4} />
						</Field>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Link · rótulo" name="manifestoLinkLabel">
								<Input
									id="manifestoLinkLabel"
									name="manifestoLinkLabel"
									defaultValue={page.manifesto?.linkLabel ?? ""}
								/>
							</Field>
							<EditorialHrefField
								label="Link · href"
								name="manifestoLinkHref"
								defaultValue={page.manifesto?.linkHref}
							/>
						</div>
						<BackgroundFields
							name="manifestoBackground"
							label="Fundo do manifesto"
							background={page.manifesto?.background}
						/>
					</section>

					<section className="space-y-4 rounded-lg border p-5">
						<h2 className="text-base font-semibold">Autora e curadoria</h2>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Eyebrow" name="authorEyebrow">
								<Input id="authorEyebrow" name="authorEyebrow" defaultValue={page.author?.eyebrow ?? ""} />
							</Field>
							<Field label="Título" name="authorTitle">
								<Input id="authorTitle" name="authorTitle" defaultValue={page.author?.title ?? ""} />
							</Field>
							<div className="md:col-span-2">
								<Field label="Texto principal" name="authorBody">
									<Textarea name="authorBody" defaultValue={page.author?.body ?? ""} rows={4} />
								</Field>
							</div>
							<div className="md:col-span-2">
								<Field label="Texto secundário" name="authorSecondaryBody">
									<Textarea
										name="authorSecondaryBody"
										defaultValue={page.author?.secondaryBody ?? ""}
										rows={4}
									/>
								</Field>
							</div>
							<Field label="CTA principal · rótulo" name="authorPrimaryCtaLabel">
								<Input
									id="authorPrimaryCtaLabel"
									name="authorPrimaryCtaLabel"
									defaultValue={page.author?.primaryCtaLabel ?? ""}
								/>
							</Field>
							<EditorialHrefField
								label="CTA principal · href"
								name="authorPrimaryCtaHref"
								defaultValue={page.author?.primaryCtaHref}
							/>
							<Field label="CTA secundária · rótulo" name="authorSecondaryCtaLabel">
								<Input
									id="authorSecondaryCtaLabel"
									name="authorSecondaryCtaLabel"
									defaultValue={page.author?.secondaryCtaLabel ?? ""}
								/>
							</Field>
							<EditorialHrefField
								label="CTA secundária · href"
								name="authorSecondaryCtaHref"
								defaultValue={page.author?.secondaryCtaHref}
							/>
						</div>
						<Field label="Imagem do bloco de autoria" name="authorImageSrc">
							<AdminImageUrlList
								name="authorImageSrc"
								initialValues={page.author?.image?.src ? [page.author.image.src] : []}
								uploadMode="on-submit"
								maxItems={1}
							/>
						</Field>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Alt da imagem" name="authorImageAlt">
								<Input
									id="authorImageAlt"
									name="authorImageAlt"
									defaultValue={page.author?.image?.alt ?? ""}
								/>
							</Field>
							<Field label="Legenda pública da imagem" name="authorImageCaption">
								<Input
									id="authorImageCaption"
									name="authorImageCaption"
									defaultValue={page.author?.image?.caption ?? ""}
								/>
							</Field>
						</div>
					</section>

					<section className="grid gap-4 rounded-lg border p-5">
						<h2 className="text-base font-semibold">CTA final</h2>
						<Field label="Título" name="communityTitle">
							<Input id="communityTitle" name="communityTitle" defaultValue={page.community?.title ?? ""} />
						</Field>
						<Field label="Texto" name="communityBody">
							<Textarea name="communityBody" defaultValue={page.community?.body ?? ""} rows={4} />
						</Field>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="CTA principal · rótulo" name="communityPrimaryCtaLabel">
								<Input
									id="communityPrimaryCtaLabel"
									name="communityPrimaryCtaLabel"
									defaultValue={page.community?.primaryCtaLabel ?? ""}
								/>
							</Field>
							<EditorialHrefField
								label="CTA principal · href"
								name="communityPrimaryCtaHref"
								defaultValue={page.community?.primaryCtaHref}
							/>
						</div>
						{[1, 2, 3].map((index) => (
							<div key={index} className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
								<Field label={`Link ${index} · rótulo`} name={`communityLink${index}Label`}>
									<Input
										id={`communityLink${index}Label`}
										name={`communityLink${index}Label`}
										defaultValue={communityLinks[index - 1]?.label ?? ""}
									/>
								</Field>
								<EditorialHrefField
									label={`Link ${index} · href`}
									name={`communityLink${index}Href`}
									defaultValue={communityLinks[index - 1]?.href}
								/>
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

					<Button type="submit">{submitLabel}</Button>
				</form>
			</CardContent>
		</Card>
	);
}
