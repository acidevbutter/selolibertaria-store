import type { ReactNode } from "react";
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
}: {
	label: string;
	name: string;
	children: ReactNode;
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

export function Textarea({
	name,
	defaultValue,
	rows = 3,
	placeholder,
}: {
	name: string;
	defaultValue?: string;
	rows?: number;
	placeholder?: string;
}) {
	return (
		<textarea
			id={name}
			name={name}
			defaultValue={defaultValue}
			rows={rows}
			placeholder={placeholder}
			className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
		/>
	);
}

export function ActiveCheckbox({ defaultChecked = true }: { defaultChecked?: boolean }) {
	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div className="space-y-1">
				<h3 className="text-sm font-medium">Availability</h3>
				<p className="text-xs text-muted-foreground">
					Choose whether this item should stay available in the catalog.
				</p>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				<label className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm">
					<input type="radio" name="active" value="true" defaultChecked={defaultChecked} className="mt-0.5" />
					<span className="space-y-1">
						<span className="block font-medium">Active</span>
						<span className="block text-xs text-muted-foreground">
							The product stays visible and available for use in the admin flow.
						</span>
					</span>
				</label>
				<label className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm">
					<input
						type="radio"
						name="active"
						value="false"
						defaultChecked={!defaultChecked}
						className="mt-0.5"
					/>
					<span className="space-y-1">
						<span className="block font-medium">Deactivate</span>
						<span className="block text-xs text-muted-foreground">
							Use this when the product or variant should no longer be active.
						</span>
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
		<section className="space-y-4 rounded-lg border p-5">
			<div className="space-y-1">
				<h2 className="text-base font-semibold">{title}</h2>
				{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
			</div>
			{children}
		</section>
	);
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
}) {
	const selectedCategorySlug =
		categories.find((item) => item.slug === category || item.name.toLowerCase() === category.toLowerCase())
			?.slug || "";

	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Field label="Name" name="name">
				<Input id="name" name="name" defaultValue={name} minLength={2} required />
			</Field>
			<Field label="Slug" name="slug" hint="Use kebab-case, for example camiseta-preta.">
				<Input
					id="slug"
					name="slug"
					defaultValue={slug}
					placeholder="product-slug"
					pattern={fieldPatterns.kebabCase}
					title="Use kebab-case, for example camiseta-preta."
				/>
			</Field>
			<Field label="Category" name="category" hint="Choose the category used to organize this product.">
				<CategorySelectField categories={categories} defaultValue={selectedCategorySlug} />
			</Field>
			<Field
				label="Display order"
				name="order"
				hint="Choosing a taken position pushes the current product and the following ones down automatically."
			>
				<select
					id="order"
					name="order"
					defaultValue={order || String(orderOptions[0] ?? 1)}
					className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-hidden focus:ring-1 focus:ring-ring"
				>
					{orderOptions.map((option) => (
						<option key={option} value={String(option)}>
							Position {option}
						</option>
					))}
				</select>
			</Field>
			<Field label="Stock" name="stock" hint="Use a whole number such as 25.">
				<Input
					id="stock"
					name="stock"
					type="number"
					min="0"
					step="1"
					defaultValue={stock}
					inputMode="numeric"
					placeholder="25"
				/>
			</Field>
			<div className="md:col-span-2">
				<Field label="Description" name="description">
					<Textarea name="description" defaultValue={description} />
				</Field>
			</div>
			<div className="md:col-span-2">
				<Field
					label="Images"
					name="images"
					hint="Selecione imagens do computador para enviar e organizar a galeria do produto."
				>
					<AdminImageUrlList name="images" initialValues={images} autoSubmitOnUpload={autoSubmitImages} />
				</Field>
			</div>
		</div>
	);
}

export function ImagePreviewField({ images, alt }: { images: string[]; alt: string }) {
	return (
		<Field label="Image preview" name={`${alt}-preview`}>
			<AdminProductImagePreview images={images} alt={alt} />
		</Field>
	);
}

export function ImageUrlsField({ name = "images", images }: { name?: string; images: string[] }) {
	return (
		<Field
			label="Images"
			name={name}
			hint="Selecione imagens do computador para enviar e organizar a galeria do produto."
		>
			<AdminImageUrlList name={name} initialValues={images} />
		</Field>
	);
}

export function PriceFields({ price, currency = "usd" }: { price?: number | null; currency?: string }) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Field label="Price" name="price" hint="Saving a changed price creates a new Stripe Price.">
				<Input
					id="price"
					name="price"
					type="number"
					step="0.01"
					min="0"
					defaultValue={typeof price === "number" ? String(price) : ""}
					required
				/>
			</Field>
			<Field label="Currency" name="currency">
				<Input
					id="currency"
					name="currency"
					defaultValue={currency.toLowerCase()}
					maxLength={3}
					pattern={fieldPatterns.currency}
					title="Use a 3-letter currency code, such as usd or brl."
					required
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
				<h3 className="text-sm font-medium">Inherited from product</h3>
				<p className="text-xs text-muted-foreground">
					Name, slug, category, description, and images stay in sync with the group.
				</p>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>Name</Label>
					<div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{name}</div>
				</div>
				<div className="space-y-2">
					<Label>Slug</Label>
					<div className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">{slug}</div>
				</div>
				<div className="space-y-2">
					<Label>Category</Label>
					<div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{category || "No category"}</div>
				</div>
				<div className="space-y-2">
					<Label>Description</Label>
					<div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
						{description || "No description"}
					</div>
				</div>
			</div>
			<ImagePreviewField images={images} alt={name || slug || "Product image"} />
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
		<div className="grid gap-4 md:grid-cols-2">
			<Field label="Variant label" name="variant">
				<Input id="variant" name="variant" defaultValue={variant} placeholder="Red, XL, Framed..." />
			</Field>
			<Field label="Variant order" name="variantOrder">
				<Input
					id="variantOrder"
					name="variantOrder"
					type="number"
					step="0.01"
					defaultValue={variantOrder}
					inputMode="decimal"
					placeholder="1"
				/>
			</Field>
		</div>
	);
}

export function SubmitButton({ children }: { children: ReactNode }) {
	return <Button type="submit">{children}</Button>;
}

export { VariantPriceFields };
