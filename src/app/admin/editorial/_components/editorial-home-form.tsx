import { AdminImageUrlList } from "@/app/admin/products/_components/admin-image-url-list.client";
import type { EditorialHomePage } from "@/lib/editorial-content";
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
							<Field label="CTA principal · link" name="heroPrimaryCtaHref">
								<Input
									id="heroPrimaryCtaHref"
									name="heroPrimaryCtaHref"
									defaultValue={page.hero?.primaryCtaHref ?? ""}
								/>
							</Field>
							<Field label="CTA secundária · rótulo" name="heroSecondaryCtaLabel">
								<Input
									id="heroSecondaryCtaLabel"
									name="heroSecondaryCtaLabel"
									defaultValue={page.hero?.secondaryCtaLabel ?? ""}
								/>
							</Field>
							<Field label="CTA secundária · link" name="heroSecondaryCtaHref">
								<Input
									id="heroSecondaryCtaHref"
									name="heroSecondaryCtaHref"
									defaultValue={page.hero?.secondaryCtaHref ?? ""}
								/>
							</Field>
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
						<Field label="Imagem" name="heroFeatureImageSrc">
							<AdminImageUrlList
								name="heroFeatureImageSrc"
								initialValues={page.hero?.featureImage?.src ? [page.hero.featureImage.src] : []}
								uploadMode="on-submit"
								maxItems={1}
							/>
						</Field>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Alt da imagem" name="heroFeatureImageAlt">
								<Input
									id="heroFeatureImageAlt"
									name="heroFeatureImageAlt"
									defaultValue={page.hero?.featureImage?.alt ?? ""}
								/>
							</Field>
							<Field label="Legenda da imagem" name="heroFeatureImageCaption">
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
							<Field label="Link · href" name="manifestoLinkHref">
								<Input
									id="manifestoLinkHref"
									name="manifestoLinkHref"
									defaultValue={page.manifesto?.linkHref ?? ""}
								/>
							</Field>
						</div>
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
							<Field label="CTA principal · href" name="authorPrimaryCtaHref">
								<Input
									id="authorPrimaryCtaHref"
									name="authorPrimaryCtaHref"
									defaultValue={page.author?.primaryCtaHref ?? ""}
								/>
							</Field>
							<Field label="CTA secundária · rótulo" name="authorSecondaryCtaLabel">
								<Input
									id="authorSecondaryCtaLabel"
									name="authorSecondaryCtaLabel"
									defaultValue={page.author?.secondaryCtaLabel ?? ""}
								/>
							</Field>
							<Field label="CTA secundária · href" name="authorSecondaryCtaHref">
								<Input
									id="authorSecondaryCtaHref"
									name="authorSecondaryCtaHref"
									defaultValue={page.author?.secondaryCtaHref ?? ""}
								/>
							</Field>
						</div>
						<Field label="Imagem" name="authorImageSrc">
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
							<Field label="Legenda da imagem" name="authorImageCaption">
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
							<Field label="CTA principal · href" name="communityPrimaryCtaHref">
								<Input
									id="communityPrimaryCtaHref"
									name="communityPrimaryCtaHref"
									defaultValue={page.community?.primaryCtaHref ?? ""}
								/>
							</Field>
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
								<Field label={`Link ${index} · href`} name={`communityLink${index}Href`}>
									<Input
										id={`communityLink${index}Href`}
										name={`communityLink${index}Href`}
										defaultValue={communityLinks[index - 1]?.href ?? ""}
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

					<Button type="submit">{submitLabel}</Button>
				</form>
			</CardContent>
		</Card>
	);
}
