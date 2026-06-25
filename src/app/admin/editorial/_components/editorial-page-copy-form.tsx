import type { ReactNode } from "react";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";

type FieldType = "text" | "textarea";

type FieldConfig = {
	name: string;
	label: string;
	help?: string;
	route?: string;
	type?: FieldType;
	rows?: number;
	defaultValue?: string | null;
};

type SectionConfig = {
	title: string;
	description?: string;
	route: string;
	fields: FieldConfig[];
};

type PublishedState = {
	published: boolean;
	order: number;
	title: string;
	summary?: string | null;
};

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
			name={name}
			defaultValue={defaultValue ?? ""}
			rows={rows}
			className="min-h-24 w-full rounded-none border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:outline-hidden"
		/>
	);
}

function Field({ field }: { field: FieldConfig }) {
	return (
		<label className="grid gap-2">
			<span className="text-sm font-medium text-[color:var(--editorial-ink)]">{field.label}</span>
			{field.route ? (
				<span className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
					Aparece em: {field.route}
				</span>
			) : null}
			{field.type === "textarea" ? (
				<Textarea name={field.name} defaultValue={field.defaultValue} rows={field.rows} />
			) : (
				<Input name={field.name} defaultValue={field.defaultValue ?? ""} />
			)}
			{field.help ? <span className="text-xs leading-5 text-[color:var(--editorial-muted)]">{field.help}</span> : null}
		</label>
	);
}

export function EditorialPageCopyForm({
	action,
	submitLabel,
	base,
	sections,
	children,
}: {
	action: (formData: FormData) => Promise<void>;
	submitLabel: string;
	base: PublishedState;
	sections: SectionConfig[];
	children?: ReactNode;
}) {
	return (
		<Card className="rounded-none border-[color:var(--editorial-border)]">
			<CardHeader>
				<CardTitle>{submitLabel}</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={action} className="space-y-6">
					<section className="grid gap-4 rounded-none border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-5 md:grid-cols-2">
						<label className="grid gap-2 md:col-span-2">
							<span className="text-sm font-medium text-[color:var(--editorial-ink)]">Título interno</span>
							<Input name="title" defaultValue={base.title} required />
						</label>
						<label className="grid gap-2">
							<span className="text-sm font-medium text-[color:var(--editorial-ink)]">Resumo interno</span>
							<Textarea name="summary" defaultValue={base.summary ?? ""} rows={3} />
						</label>
						<label className="grid gap-2">
							<span className="text-sm font-medium text-[color:var(--editorial-ink)]">Ordem</span>
							<Input name="order" type="number" min="1" step="1" defaultValue={String(base.order)} />
						</label>
					</section>

					{sections.map((section) => (
						<section
							key={section.title}
							className="space-y-4 rounded-none border border-[color:var(--editorial-border)] p-5"
						>
							<div className="space-y-1">
								<h2 className="text-lg font-semibold text-[color:var(--editorial-ink)]">{section.title}</h2>
								<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
									Aparece em: {section.route}
									{section.description ? ` · ${section.description}` : ""}
								</p>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								{section.fields.map((field) => (
									<div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : undefined}>
										<Field field={{ ...field, route: field.route ?? section.route }} />
									</div>
								))}
							</div>
						</section>
					))}

					{children}

					<section className="rounded-none border border-[color:var(--editorial-border)] p-5">
						<div className="space-y-3">
							<p className="text-sm font-medium text-[color:var(--editorial-ink)]">Estado da publicação</p>
							<label className="flex items-start gap-3 rounded-none border border-[color:var(--editorial-border)] px-3 py-3 text-sm">
								<input type="radio" name="published" value="true" defaultChecked={base.published} className="mt-0.5" />
								<span>Publicado</span>
							</label>
							<label className="flex items-start gap-3 rounded-none border border-[color:var(--editorial-border)] px-3 py-3 text-sm">
								<input
									type="radio"
									name="published"
									value="false"
									defaultChecked={!base.published}
									className="mt-0.5"
								/>
								<span>Rascunho</span>
							</label>
						</div>
					</section>

					<Button type="submit" className="rounded-none">
						{submitLabel}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
