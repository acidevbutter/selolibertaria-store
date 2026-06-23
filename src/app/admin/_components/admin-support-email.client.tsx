"use client";
import { useEffect, useState } from "react";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";

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
				setStatus("E-mail de suporte salvo.");
			} else {
				setStatus("Não foi possível salvar o e-mail de suporte.");
			}
		} catch (e) {
			setStatus("Não foi possível salvar o e-mail de suporte.");
		}
		setLoading(false);
		setTimeout(() => setStatus(null), 3000);
	}

	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium">E-mail de suporte</label>
			<p className="text-sm text-muted-foreground">
				Usado nos modelos de e-mail e nos pontos de suporte da loja.
			</p>
			<div className="flex flex-wrap items-end gap-2">
				<Input
					value={email ?? ""}
					onChange={(e) => setEmail(e.target.value)}
					onBlur={(e) => setEmail(normalizeSupportEmail(e.target.value))}
					placeholder="contact@selolibertaria.com"
					className="max-w-md flex-1"
					autoCapitalize="none"
					autoCorrect="off"
					spellCheck={false}
				/>
				<Button type="button" onClick={save} disabled={loading}>
					Salvar e-mail
				</Button>
			</div>
			{status && <div className="text-sm text-muted-foreground">{status}</div>}
		</div>
	);
}

export default AdminSupportEmail;
