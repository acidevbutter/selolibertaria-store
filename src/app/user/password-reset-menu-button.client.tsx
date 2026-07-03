"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PasswordResetMenuButton({ email }: { email: string }) {
	const [sending, setSending] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function handleClick() {
		setSending(true);
		setMessage(null);

		try {
			const res = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			setMessage(
				res.ok
					? "Enviamos o link de troca de senha para o seu e-mail."
					: "Não foi possível enviar o link de troca de senha agora.",
			);
		} catch {
			setMessage("Não foi possível enviar o link de troca de senha agora.");
		} finally {
			setSending(false);
		}
	}

	return (
		<div className="space-y-2">
			<Button type="button" variant="outline" className="w-full" onClick={handleClick} disabled={sending}>
				{sending ? "Enviando..." : "Trocar senha"}
			</Button>
			{message ? <p className="text-xs leading-5 text-muted-foreground">{message}</p> : null}
		</div>
	);
}
