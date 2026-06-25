"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";

interface ContactFormProps {
	className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
	const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
	const t = useTranslations("/contact.form");

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
		<form onSubmit={onSubmit} className={cn("space-y-6", className)}>
			<div className="grid gap-6 sm:grid-cols-2">
				<div className="space-y-2">
					<label
						htmlFor="name"
						className="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]"
					>
						{t("fields.name")}
					</label>
					<Input
						id="name"
						name="name"
						required
						placeholder={t("placeholders.name")}
						autoComplete="name"
						className="rounded-none border-[color:var(--editorial-border)] bg-[color:rgba(247,244,239,0.72)]"
					/>
				</div>
				<div className="space-y-2">
					<label
						htmlFor="email"
						className="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]"
					>
						{t("fields.email")}
					</label>
					<Input
						id="email"
						name="email"
						type="email"
						required
						placeholder={t("placeholders.email")}
						autoComplete="email"
						className="rounded-none border-[color:var(--editorial-border)] bg-[color:rgba(247,244,239,0.72)]"
					/>
				</div>
			</div>
			<div className="space-y-2">
				<label
					htmlFor="subject"
					className="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]"
				>
					{t("fields.subject")}
				</label>
				<Input
					id="subject"
					name="subject"
					required
					placeholder={t("placeholders.subject")}
					className="rounded-none border-[color:var(--editorial-border)] bg-[color:rgba(247,244,239,0.72)]"
				/>
			</div>
			<div className="space-y-2">
				<label
					htmlFor="message"
					className="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]"
				>
					{t("fields.message")}
				</label>
				<textarea
					id="message"
					name="message"
					required
					rows={6}
					className="flex min-h-48 w-full resize-y border border-[color:var(--editorial-border)] bg-[color:rgba(247,244,239,0.76)] px-4 py-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					placeholder={t("placeholders.message")}
				/>
			</div>
			<div className="flex items-center gap-4">
				<Button
					type="submit"
					disabled={status === "submitting"}
					className="min-w-40 rounded-none bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]"
				>
					{status === "submitting"
						? t("actions.sending")
						: status === "sent"
							? t("actions.sent")
							: t("actions.send")}
				</Button>
				<p aria-live="polite" className="text-xs text-neutral-500 h-4">
					{status === "sent" && t("success")}
				</p>
			</div>
		</form>
	);
}
