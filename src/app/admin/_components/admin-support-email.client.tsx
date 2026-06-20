"use client";
import { useEffect, useState } from "react";

function normalizeSupportEmail(value: string) {
	return value.trim().toLowerCase();
}

export function AdminSupportEmail() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		async function load() {
			try {
				const res = await fetch("/api/admin/settings");
				const data = (await res.json()) as { current?: { supportEmail?: string } } | null;
				if (mounted) setEmail(data?.current?.supportEmail ?? "");
			} catch (e) {}
		}
		load();
		return () => {
			mounted = false;
		};
	}, []);

	async function save() {
		setLoading(true);
		setStatus(null);
		try {
			const res = await fetch("/api/admin/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ supportEmail: email || null }),
				credentials: "include",
			});
			if (res.ok) {
				setStatus("Email de suporte salvo.");
			} else {
				setStatus("Não foi possível salvar o email de suporte.");
			}
		} catch (e) {
			setStatus("Não foi possível salvar o email de suporte.");
		}
		setLoading(false);
		setTimeout(() => setStatus(null), 3000);
	}

	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium">Email de suporte</label>
			<p className="text-sm text-muted-foreground">
				Usado como contato operacional nos templates, emails transacionais e pontos de suporte da loja.
			</p>
			<div className="flex gap-2">
				<input
					value={email ?? ""}
					onChange={(e) => setEmail(e.target.value)}
					onBlur={(e) => setEmail(normalizeSupportEmail(e.target.value))}
					placeholder="contact@selolibertaria.com"
					className="flex-1 rounded border px-3 py-2 bg-background text-foreground"
					autoCapitalize="none"
					autoCorrect="off"
					spellCheck={false}
				/>
				<button
					onClick={save}
					disabled={loading}
					className="rounded bg-primary px-3 py-2 text-white dark:text-black"
				>
					Salvar
				</button>
			</div>
			{status && <div className="text-sm text-muted-foreground">{status}</div>}
		</div>
	);
}

export default AdminSupportEmail;
