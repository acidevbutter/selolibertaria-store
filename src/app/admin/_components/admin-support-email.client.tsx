"use client";
import { useEffect, useState } from "react";
import { SlButton } from "@/ui/sl/sl-button";

const fieldClassName =
	"h-[var(--sl-h-button)] max-w-md flex-1 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-4 text-sm text-[var(--sl-ink)] outline-none placeholder:text-[color:var(--sl-text-disabled)] disabled:opacity-50";
const fieldStyle = { borderRadius: "var(--sl-radius)" } as const;

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
			<p className="text-sm text-[var(--sl-text-muted)]">
				Usado nos modelos de e-mail e nos pontos de suporte da loja.
			</p>
			<div className="flex flex-wrap items-end gap-2">
				<input
					value={email ?? ""}
					onChange={(e) => setEmail(e.target.value)}
					onBlur={(e) => setEmail(normalizeSupportEmail(e.target.value))}
					placeholder="contact@selolibertaria.com"
					className={fieldClassName}
					style={fieldStyle}
					autoCapitalize="none"
					autoCorrect="off"
					spellCheck={false}
				/>
				<SlButton type="button" variant="primary" onClick={save} disabled={loading}>
					Salvar e-mail
				</SlButton>
			</div>
			{status && <div className="text-sm text-[var(--sl-text-muted)]">{status}</div>}
		</div>
	);
}

export default AdminSupportEmail;
