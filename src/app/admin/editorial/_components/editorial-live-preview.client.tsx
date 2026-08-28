"use client";

import { Eye, Monitor, RotateCcw, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";
import { Button } from "@/ui/shadcn/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/shadcn/dialog";

type DraftValues = Record<string, string[]>;
type MediaOverrides = Record<string, string | null>;

type EditorialDraftMediaEvent = CustomEvent<{ formId: string; name: string; src: string | null }>;
type EditorialDraftDiscardEvent = CustomEvent<{ formId: string }>;
type EditorialDraftSavedEvent = CustomEvent<{ formId: string }>;

function storageKey(formId: string) {
	return `selo-editorial-draft:${formId}`;
}

function serializeForm(form: HTMLFormElement): DraftValues {
	const values: DraftValues = {};
	for (const [name, value] of new FormData(form).entries()) {
		if (value instanceof File) continue;
		(values[name] ??= []).push(value);
	}
	return values;
}

function sameDraft(left: DraftValues, right: DraftValues) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function restoreForm(form: HTMLFormElement, values: DraftValues) {
	for (const [name, entries] of Object.entries(values)) {
		const controls = form.elements.namedItem(name);
		const elements = controls instanceof RadioNodeList ? Array.from(controls) : controls ? [controls] : [];

		for (const element of elements) {
			if (
				!(
					element instanceof HTMLInputElement ||
					element instanceof HTMLSelectElement ||
					element instanceof HTMLTextAreaElement
				)
			) {
				continue;
			}
			if (element instanceof HTMLInputElement && (element.type === "radio" || element.type === "checkbox")) {
				element.checked = entries.includes(element.value);
			} else if (element instanceof HTMLSelectElement && element.multiple) {
				for (const option of element.options) option.selected = entries.includes(option.value);
			} else {
				element.value = entries.at(-1) ?? "";
			}
		}
	}
}

function firstValue(values: DraftValues, names: string[]) {
	for (const name of names) {
		const value = values[name]?.find(Boolean)?.trim();
		if (value) return value;
	}
	return "";
}

function allValues(values: DraftValues, matcher: RegExp) {
	return Object.entries(values)
		.filter(([name]) => matcher.test(name))
		.flatMap(([, entries]) => entries)
		.map((value) => value.trim())
		.filter(Boolean);
}

function DraftCanvas({
	values,
	media,
	pageTitle,
	mobile,
}: {
	values: DraftValues;
	media: MediaOverrides;
	pageTitle: string;
	mobile: boolean;
}) {
	const eyebrow = firstValue(values, ["heroEyebrow", "eyebrow", "sectionEyebrow"]);
	const title = firstValue(values, ["heroTitle", "title", "sectionTitle", "closingTitle"]);
	const body = firstValue(values, ["heroDescription", "heroBody", "description", "body", "sectionBody"]);
	const image =
		Object.values(media).find(Boolean) ??
		firstValue(values, ["heroBackgroundSrc", "heroImageSrc", "sectionImageSrc", "imageSrc"]);
	const supporting = allValues(
		values,
		/(manifesto|why|closing|program|catalog|featured|note\d+Body|card\d+Body|formDescription|directDescription|pathsDescription)/i,
	).slice(0, 5);

	return (
		<div className={mobile ? "mx-auto w-[390px] max-w-full" : "w-full"}>
			<article className="min-h-full bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)]">
				<header className="border-b border-[color:var(--editorial-ink)] px-6 py-5 sm:px-10">
					<p className="text-[10px] font-black uppercase tracking-[0.26em] text-[color:var(--editorial-accent)]">
						Selo Libertária
					</p>
				</header>
				<section
					className="relative overflow-hidden bg-[color:var(--editorial-ink)] px-6 py-14 text-[color:var(--editorial-paper)] sm:px-10 sm:py-20"
					style={
						image
							? {
									backgroundImage: `linear-gradient(120deg, rgba(11,11,11,.82), rgba(11,11,11,.56)), url(${JSON.stringify(image)})`,
									backgroundPosition: "center",
									backgroundSize: "cover",
								}
							: undefined
					}
				>
					<div className="relative max-w-3xl space-y-5">
						<p className="text-[10px] font-black uppercase tracking-[0.26em] text-[color:var(--editorial-beige)]">
							{eyebrow || "Rascunho editorial"}
						</p>
						<h1 className="display-font text-4xl font-black leading-[.92] tracking-[-.05em] sm:text-6xl">
							{title || pageTitle}
						</h1>
						{body ? (
							<EditorialRichText
								source={body}
								className="max-w-2xl text-base leading-7 text-[color:rgba(247,244,239,.82)]"
							/>
						) : null}
					</div>
				</section>
				{supporting.length ? (
					<section className="space-y-6 px-6 py-10 sm:px-10">
						{supporting.map((content, index) => (
							<div
								key={`${content}-${index}`}
								className="border-l-2 border-[color:var(--editorial-accent)] pl-4"
							>
								<EditorialRichText
									source={content}
									className="text-sm leading-7 text-[color:var(--editorial-muted)]"
								/>
							</div>
						))}
					</section>
				) : null}
			</article>
		</div>
	);
}

export function EditorialLivePreview({
	formId,
	pageTitle,
	published,
}: {
	formId: string;
	pageTitle: string;
	published: boolean;
}) {
	const [draft, setDraft] = useState<DraftValues>({});
	const [initialDraft, setInitialDraft] = useState<DraftValues>({});
	const [media, setMedia] = useState<MediaOverrides>({});
	const dirty = !sameDraft(draft, initialDraft) || Object.values(media).some(Boolean);

	useEffect(() => {
		const form = document.getElementById(formId);
		if (!(form instanceof HTMLFormElement)) return;

		const initial = serializeForm(form);
		setInitialDraft(initial);
		const persisted = window.sessionStorage.getItem(storageKey(formId));
		if (persisted) {
			try {
				const restored = JSON.parse(persisted) as DraftValues;
				if (sameDraft(restored, initial)) {
					window.sessionStorage.removeItem(storageKey(formId));
					setDraft(initial);
				} else {
					restoreForm(form, restored);
					setDraft(restored);
				}
			} catch {
				window.sessionStorage.removeItem(storageKey(formId));
				setDraft(initial);
			}
		} else {
			setDraft(initial);
		}

		const syncDraft = () => {
			const next = serializeForm(form);
			setDraft(next);
			window.sessionStorage.setItem(storageKey(formId), JSON.stringify(next));
		};
		const handleMedia = (event: Event) => {
			const { detail } = event as EditorialDraftMediaEvent;
			if (detail.formId !== formId) return;
			setMedia((current) => ({ ...current, [detail.name]: detail.src }));
		};
		const handleDiscard = (event: Event) => {
			const { detail } = event as EditorialDraftDiscardEvent;
			if (detail.formId !== formId) return;
			form.reset();
			setDraft(initial);
			setMedia({});
			window.sessionStorage.removeItem(storageKey(formId));
		};
		const handleSaved = (event: Event) => {
			const { detail } = event as EditorialDraftSavedEvent;
			if (detail.formId !== formId) return;
			const next = serializeForm(form);
			setInitialDraft(next);
			setDraft(next);
			setMedia({});
			window.sessionStorage.removeItem(storageKey(formId));
		};

		form.addEventListener("input", syncDraft);
		form.addEventListener("change", syncDraft);
		window.addEventListener("editorial-draft-media", handleMedia);
		window.addEventListener("editorial-draft-discard", handleDiscard);
		window.addEventListener("editorial-draft-saved", handleSaved);
		return () => {
			form.removeEventListener("input", syncDraft);
			form.removeEventListener("change", syncDraft);
			window.removeEventListener("editorial-draft-media", handleMedia);
			window.removeEventListener("editorial-draft-discard", handleDiscard);
			window.removeEventListener("editorial-draft-saved", handleSaved);
		};
	}, [formId]);

	const status = useMemo(
		() => (dirty ? "Alterações não salvas" : published ? "Versão publicada" : "Rascunho salvo"),
		[dirty, published],
	);

	function discardDraft() {
		window.dispatchEvent(new CustomEvent("editorial-draft-discard", { detail: { formId } }));
	}

	return (
		<aside className="sticky top-6 overflow-hidden border border-[color:var(--editorial-border)] bg-[#fbf7f1] shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--editorial-border)] px-4 py-3">
				<div>
					<p className="text-sm font-semibold text-[color:var(--editorial-ink)]">Rascunho ao vivo</p>
					<p className="mt-1 text-xs text-[color:var(--editorial-muted)]">{status}</p>
				</div>
				{dirty ? (
					<Button type="button" size="sm" variant="outline" className="rounded-none" onClick={discardDraft}>
						<RotateCcw className="h-4 w-4" />
						Descartar
					</Button>
				) : null}
			</div>
			<div className="max-h-[calc(100vh-11rem)] overflow-auto bg-muted p-3">
				<DraftCanvas values={draft} media={media} pageTitle={pageTitle} mobile={false} />
			</div>
		</aside>
	);
}

export function EditorialFullPagePreview({ href }: { href: string }) {
	const [open, setOpen] = useState(false);
	const [mobile, setMobile] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" className="rounded-none">
					<Eye className="h-4 w-4" />
					Visualizar página inteira
				</Button>
			</DialogTrigger>
			<DialogContent className="h-[88vh] max-w-7xl overflow-hidden p-0">
				<DialogHeader className="flex-row items-center justify-between border-b p-4 pr-12">
					<div>
						<DialogTitle>Página pública</DialogTitle>
						<p className="mt-1 text-xs text-muted-foreground">Última versão salva e publicada.</p>
					</div>
					<Button type="button" size="sm" variant="outline" onClick={() => setMobile((value) => !value)}>
						{mobile ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
						{mobile ? "Desktop" : "Mobile"}
					</Button>
				</DialogHeader>
				<div className="h-[calc(88vh-73px)] overflow-auto bg-muted p-4">
					<iframe
						title="Visualização da página pública"
						src={href}
						className={mobile ? "mx-auto h-full w-[390px] max-w-full bg-white" : "h-full w-full bg-white"}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function EditorialDraftSavedSignal({ formId }: { formId: string }) {
	useEffect(() => {
		window.dispatchEvent(new CustomEvent("editorial-draft-saved", { detail: { formId } }));
	}, [formId]);
	return null;
}
