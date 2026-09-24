"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "@/i18n/client";
import { cn } from "@/lib/utils";

interface ContactFormProps {
	className?: string;
	subjectSuggestions?: string[];
}

const FIELD_CLASS =
	"h-[var(--sl-h-field)] w-full border border-[color:var(--sl-line-strong)] bg-[color:var(--sl-surface-card)] px-3.5 text-[var(--sl-size-body)] text-[color:var(--sl-text)] outline-none transition-colors placeholder:text-[color:var(--sl-text-disabled)] focus-visible:border-[color:var(--sl-ink)] focus-visible:shadow-[var(--sl-focus-ring)]";

const LABEL_CLASS = "sl-lbl";

export function ContactForm({ className, subjectSuggestions = [] }: ContactFormProps) {
	const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
	const t = useTranslations("/contact.form");

	// Native `required`/`type="email"` validation bubbles are localized by the
	// browser's own UI language, not this page's `lang` -- without this the
	// message shows in English even though the whole app is pt-BR only.
	const onInvalid = useCallback(
		(e: React.InvalidEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const target = e.currentTarget;
			target.setCustomValidity(
				target.validity.typeMismatch ? t("validation.email") : t("validation.required"),
			);
		},
		[t],
	);
	const onInput = useCallback((e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		e.currentTarget.setCustomValidity("");
	}, []);

	const onSubmit = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			if (status === "submitting") return;
			setStatus("submitting");
			const form = e.currentTarget;
			const data = Object.fromEntries(new FormData(form).entries());
			await new Promise((r) => setTimeout(r, 600));
			console.info("Contact message submitted", data);
			form.reset();
			setStatus("sent");
			setTimeout(() => setStatus("idle"), 3000);
		},
		[status],
	);

	return (
		<form onSubmit={onSubmit} className={cn("flex flex-col gap-6", className)}>
			<div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
				<div className="flex flex-col gap-2">
					<label htmlFor="name" className={LABEL_CLASS}>
						{t("fields.name")}
					</label>
					<input
						id="name"
						name="name"
						required
						onInvalid={onInvalid}
						onInput={onInput}
						placeholder={t("placeholders.name")}
						autoComplete="name"
						className={FIELD_CLASS}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label htmlFor="email" className={LABEL_CLASS}>
						{t("fields.email")}
					</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						onInvalid={onInvalid}
						onInput={onInput}
						placeholder={t("placeholders.email")}
						autoComplete="email"
						className={FIELD_CLASS}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<label htmlFor="subject" className={LABEL_CLASS}>
					{t("fields.subject")}
				</label>
				<input
					id="subject"
					name="subject"
					required
					onInvalid={onInvalid}
					onInput={onInput}
					placeholder={t("placeholders.subject")}
					list={subjectSuggestions.length > 0 ? "contact-subject-suggestions" : undefined}
					className={FIELD_CLASS}
				/>
				{subjectSuggestions.length > 0 ? (
					<datalist id="contact-subject-suggestions">
						{subjectSuggestions.map((subject) => (
							<option key={subject} value={subject} />
						))}
					</datalist>
				) : null}
			</div>

			<div className="flex flex-col gap-2">
				<label htmlFor="message" className={LABEL_CLASS}>
					{t("fields.message")}
				</label>
				<textarea
					id="message"
					name="message"
					required
					onInvalid={onInvalid}
					onInput={onInput}
					rows={6}
					className={cn(
						"min-h-44 w-full resize-y border border-[color:var(--sl-line-strong)] bg-[color:var(--sl-surface-card)] px-3.5 py-3 text-[var(--sl-size-body)] leading-[1.7] text-[color:var(--sl-text)] outline-none transition-colors placeholder:text-[color:var(--sl-text-disabled)] focus-visible:border-[color:var(--sl-ink)] focus-visible:shadow-[var(--sl-focus-ring)]",
					)}
					placeholder={t("placeholders.message")}
				/>
			</div>

			<div className="flex flex-wrap items-center gap-4">
				<button type="submit" disabled={status === "submitting"} className="sl-btn sl-btn-primary min-w-40">
					{status === "submitting"
						? t("actions.sending")
						: status === "sent"
							? t("actions.sent")
							: t("actions.send")}
				</button>
				<p aria-live="polite" className="m-0 text-[var(--sl-size-micro)] text-[color:var(--sl-text-soft)]">
					{status === "sent" ? t("success") : "Não usamos seu email para newsletter sem pedir."}
				</p>
			</div>
		</form>
	);
}
