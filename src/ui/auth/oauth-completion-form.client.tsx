"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/i18n/client";

type Props = {
	providerLabel: string;
};

export function OAuthCompletionForm({ providerLabel }: Props) {
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<string | null>(null);
	const t = useTranslations("Login.oauthCompletion");

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setStatus(null);
		try {
			const res = await fetch("/api/auth/oauth/complete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, name: name || undefined }),
			});
			const data = (await res.json().catch(() => ({}))) as { error?: string; redirectTo?: string };
			if (!res.ok) {
				setStatus(typeof data.error === "string" ? data.error : t("error"));
				return;
			}
			window.location.assign(data.redirectTo || "/");
		} catch {
			setStatus(t("error"));
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="grid gap-4" autoComplete="on">
			<p className="text-sm text-muted-foreground">{t("description", { provider: providerLabel })}</p>
			<div className="grid gap-2">
				<Label htmlFor="oauth-complete-email">{t("fields.email")}</Label>
				<Input
					id="oauth-complete-email"
					type="email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					autoComplete="email"
					required
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="oauth-complete-name">{t("fields.name")}</Label>
				<Input
					id="oauth-complete-name"
					value={name}
					onChange={(event) => setName(event.target.value)}
					autoComplete="name"
				/>
			</div>
			<Button type="submit" disabled={loading}>
				{loading ? t("actions.finishing") : t("actions.finish", { provider: providerLabel })}
			</Button>
			{status ? <p className="text-sm text-destructive">{status}</p> : null}
		</form>
	);
}
