"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AdminImageUrlList } from "@/app/admin/products/_components/admin-image-url-list.client";
import { AdminProductImagePreview } from "@/app/admin/products/_components/admin-product-image-preview";
import { CategorySelectField } from "@/app/admin/products/_components/category-select-field.client";
import { VariantPriceFields } from "@/app/admin/products/_components/variant-price-fields.client";
import { fieldPatterns } from "@/lib/admin-product-form-schema";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";

export function Field({
	label,
	name,
	children,
	hint,
	className,
}: {
	label: string;
	name: string;
	children: ReactNode;
	hint?: string;
	className?: string;
}) {
	return (
		<div className={className ?? "space-y-2"}>
			<Label
				htmlFor={name}
				className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]"
			>
				{label}
			</Label>
			{children}
			{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
		</div>
	);
}

export function Textarea({
	name,
	defaultValue,
	rows = 3,
	placeholder,
	className,
}: {
	name: string;
	defaultValue?: string | null;
	rows?: number;
	placeholder?: string;
	className?: string;
}) {
	return (
		<textarea
			id={name}
			name={name}
			defaultValue={defaultValue ?? undefined}
			rows={rows}
			placeholder={placeholder}
			className={`flex min-h-24 w-full border border-[color:var(--editorial-border)] bg-[color:rgba(247,244,239,0.76)] px-4 py-3 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className ?? ""}`}
		/>
	);
}

export function ActiveCheckbox({ defaultChecked = true }: { defaultChecked?: boolean }) {
	return (
		<div className="space-y-3 border border-[color:var(--editorial-border)] bg-[color:rgba(247,244,239,0.72)] p-5">
			<div className="space-y-1">
				<h3 className="text-sm font-medium">Disponibilidade</h3>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				<label className="flex cursor-pointer items-start gap-3 border border-[color:var(--editorial-border)] bg-white/50 px-3 py-3 text-sm">
					<input type="radio" name="active" value="true" defaultChecked={defaultChecked} className="mt-0.5" />
					<span className="space-y-1">
						<span className="block font-medium">Ativo</span>
						<span className="block text-xs text-muted-foreground">Disponível no catálogo.</span>
					</span>
				</label>
				<label className="flex cursor-pointer items-start gap-3 border border-[color:var(--editorial-border)] bg-white/50 px-3 py-3 text-sm">
					<input
						type="radio"
						name="active"
						value="false"
						defaultChecked={!defaultChecked}
						className="mt-0.5"
					/>
					<span className="space-y-1">
						<span className="block font-medium">Desativar</span>
						<span className="block text-xs text-muted-foreground">Oculta o item no catálogo.</span>
					</span>
				</label>
			</div>
		</div>
	);
}

export function FormSection({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<section className="space-y-4 border border-[color:var(--editorial-border)] bg-[color:rgba(255,251,245,0.74)] p-5">
			<div className="space-y-1">
				<h2 className="editorial-serif text-2xl font-semibold">{title}</h2>
				{description ? (
					<p className="text-sm leading-7 text-[color:var(--editorial-muted)]">{description}</p>
				) : null}
			</div>
			{children}
		</section>
	);
}

function formatSlugToKebab(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function formatSlugWhileTyping(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+/g, "");
}

function applySlugAutoFormat(event: { currentTarget: HTMLInputElement }) {
	event.currentTarget.value = formatSlugWhileTyping(event.currentTarget.value);
}

function applySlugBlurFormat(event: { currentTarget: HTMLInputElement }) {
	event.currentTarget.value = formatSlugToKebab(event.currentTarget.value);
}

function formatDecimalWhileTyping(value: string) {
	const normalized = value.replace(/\s+/g, "").replace(/\./g, ",").replace(/[^0-9,]/g, "");
	const [integerPart = "", ...decimalParts] = normalized.split(",");
	const decimalPart = decimalParts.join("");
	return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
}

function formatDecimalOnBlur(value: string) {
	return formatDecimalWhileTyping(value).replace(/^,/, "").replace(/,$/, "");
}

function applyDecimalAutoFormat(event: { currentTarget: HTMLInputElement }) {
	event.currentTarget.value = formatDecimalWhileTyping(event.currentTarget.value);
}

function applyDecimalBlurFormat(event: { currentTarget: HTMLInputElement }) {
	event.currentTarget.value = formatDecimalOnBlur(event.currentTarget.value);
}

export function ProductCoreFields({
	name = "",
	slug = "",
	category = "",
	description = "",
	images = [],
	stock = "",
	order = "",
	categories = [],
	orderOptions = [],
	autoSubmitImages = false,
	autoFormatSlug = false,
}: {
	name?: string;
	slug?: string;
	category?: string;
	description?: string;
	images?: string[];
	stock?: string;
	order?: string;
	categories?: Array<{ name: string; slug: string }>;
	orderOptions?: number[];
	autoSubmitImages?: boolean;
	autoFormatSlug?: boolean;
}) {
	const selectedCategorySlug =
		categories.find((item) => item.slug === category || item.name.toLowerCase() === category.toLowerCase())
			?.slug || "";

	return (
		<div className="grid gap-4 md:grid-cols-12">
			<Field label="Nome" name="name" className="space-y-2 md:col-span-7 xl:col-span-6">
				<Input id="name" name="name" defaultValue={name} minLength={2} required className="max-w-xl" />
			</Field>
			<Field label="Slug" name="slug" className="space-y-2 md:col-span-5 xl:col-span-4">
				<Input
					id="slug"
					name="slug"
					defaultValue={slug}
					placeholder="livro-exemplo"
					pattern={fieldPatterns.kebabCase}
					title="Use kebab-case, por exemplo livro-exemplo."
					className="max-w-sm"
					onChange={autoFormatSlug ? applySlugAutoFormat : undefined}
					onInput={autoFormatSlug ? applySlugAutoFormat : undefined}
					onBlur={autoFormatSlug ? applySlugBlurFormat : undefined}
				/>
			</Field>
			<Field label="Categoria" name="category" className="space-y-2 md:col-span-4 xl:col-span-3">
				<CategorySelectField
					categories={categories}
					defaultValue={selectedCategorySlug}
					triggerClassName="max-w-xs"
				/>
			</Field>
			<Field label="Ordem" name="order" className="space-y-2 md:col-span-4 xl:col-span-3">
				<select
					id="order"
					name="order"
					defaultValue={order || String(orderOptions[0] ?? 1)}
					className="flex h-9 w-full max-w-[11rem] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-hidden focus:ring-1 focus:ring-ring"
				>
					{orderOptions.map((option) => (
						<option key={option} value={String(option)}>
							Posição {option}
						</option>
					))}
				</select>
			</Field>
			<Field label="Estoque" name="stock" className="space-y-2 md:col-span-4 xl:col-span-2">
				<Input
					id="stock"
					name="stock"
					type="number"
					min="0"
					step="1"
					defaultValue={stock}
					inputMode="numeric"
					placeholder="25"
					className="max-w-[9rem]"
				/>
			</Field>
			<div className="md:col-span-12 xl:col-span-8">
				<Field label="Descrição" name="description">
					<Textarea name="description" defaultValue={description} className="max-w-4xl" />
				</Field>
			</div>
			<div className="md:col-span-12">
				<Field
					label="Imagens"
					name="images"
					hint="Selecione imagens do computador para enviar e organizar a galeria do livro."
				>
					<AdminImageUrlList name="images" initialValues={images} autoSubmitOnUpload={autoSubmitImages} />
				</Field>
			</div>
		</div>
	);
}

export function ImagePreviewField({ images, alt }: { images: string[]; alt: string }) {
	return (
		<Field label="Prévia das imagens" name={`${alt}-preview`}>
			<AdminProductImagePreview images={images} alt={alt} />
		</Field>
	);
}

export function ImageUrlsField({ name = "images", images }: { name?: string; images: string[] }) {
	return (
		<Field
			label="Imagens"
			name={name}
			hint="Selecione imagens do computador para enviar e organizar a galeria do livro."
		>
			<AdminImageUrlList name={name} initialValues={images} />
		</Field>
	);
}

export function PriceFields({ price }: { price?: number | null }) {
	return (
		<div className="grid gap-4 md:grid-cols-12">
			<Field
				label="Preço"
				name="price"
				className="space-y-2 md:col-span-4 xl:col-span-3"
				hint="Use valor decimal, como 19,90."
			>
				<Input
					id="price"
					name="price"
					type="text"
					inputMode="decimal"
					pattern={fieldPatterns.decimal}
					defaultValue={typeof price === "number" ? String(price).replace(".", ",") : ""}
					required
					placeholder="19,90"
					className="max-w-[10rem]"
					onChange={applyDecimalAutoFormat}
					onInput={applyDecimalAutoFormat}
					onBlur={applyDecimalBlurFormat}
				/>
			</Field>
		</div>
	);
}

export function InheritedVariantFields({
	name,
	slug,
	category,
	description,
	images,
}: {
	name: string;
	slug: string;
	category: string;
	description: string;
	images: string[];
}) {
	return (
		<div className="space-y-4 rounded-md border p-4">
			<div className="space-y-1">
				<h3 className="text-sm font-medium">Herdado do livro</h3>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>Nome</Label>
					<div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{name}</div>
				</div>
				<div className="space-y-2">
					<Label>Slug</Label>
					<div className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">{slug}</div>
				</div>
				<div className="space-y-2">
					<Label>Categoria</Label>
					<div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
						{category || "Categoria não informada"}
					</div>
				</div>
				<div className="space-y-2">
					<Label>Descrição</Label>
					<div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
						{description || "Usa o resumo do livro."}
					</div>
				</div>
			</div>
			<ImagePreviewField images={images} alt={name || slug || "Imagem do livro"} />
		</div>
	);
}

export function VariantFields({
	variant = "",
	variantOrder = "",
}: {
	variant?: string;
	variantOrder?: string;
}) {
	return (
		<div className="grid gap-4 md:grid-cols-12">
			<Field label="Nome da variante" name="variant" className="space-y-2 md:col-span-7 xl:col-span-5">
				<Input
					id="variant"
					name="variant"
					defaultValue={variant}
					placeholder="Capa dura, bolso, edição 2..."
					className="max-w-md"
				/>
			</Field>
			<Field label="Ordem da variante" name="variantOrder" className="space-y-2 md:col-span-5 xl:col-span-3">
				<Input
					id="variantOrder"
					name="variantOrder"
					type="number"
					step="0.01"
					defaultValue={variantOrder}
					inputMode="decimal"
					placeholder="1"
					className="max-w-[10rem]"
				/>
			</Field>
		</div>
	);
}

export function SubmitButton({ children }: { children: ReactNode }) {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" disabled={pending}>
			{pending ? "Salvando..." : children}
		</Button>
	);
}

export { VariantPriceFields };
