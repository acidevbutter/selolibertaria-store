"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { CountrySelect } from "@/ui/auth/country-select";
import { Label } from "@/ui/shadcn/label";
import { SlButton } from "@/ui/sl/sl-button";

type SettingsPayload = {
	current?: {
		defaultCountry?: string | null;
		defaultLocale?: string | null;
	};
};

export default function AdminRegionalSettings() {
	const [defaultCountry, setDefaultCountry] = useState("BR");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const res = await fetch("/api/admin/settings", { credentials: "include" });
				if (!res.ok) return;
				const data = (await res.json()) as SettingsPayload;
				if (mounted && data.current?.defaultCountry) setDefaultCountry(data.current.defaultCountry);
			} catch {
				if (mounted) setStatus("Não foi possível carregar os padrões regionais.");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	async function save() {
		setSaving(true);
		setStatus(null);
		try {
			const res = await fetch("/api/admin/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ defaultCountry, defaultLocale: DEFAULT_LOCALE }),
			});
			if (!res.ok) {
				setStatus("Não foi possível salvar os padrões regionais.");
				return;
			}
			setStatus("Padrões regionais salvos.");
		} catch {
			setStatus("Não foi possível salvar os padrões regionais.");
		} finally {
			setSaving(false);
			setTimeout(() => setStatus(null), 3500);
		}
	}

	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<p className="text-sm text-[var(--sl-text-muted)]">
					O storefront público do Selo Libertária funciona somente em português do Brasil. Cookies, prefixos
					legados e o idioma do navegador não alteram mais o idioma renderizado.
				</p>
				<p className="text-sm text-[var(--sl-text-muted)]">
					O país padrão continua preenchendo telefone e endereço quando a pessoa usuária ainda não salvou uma
					região.
				</p>
			</div>
			<div className="grid gap-4 md:grid-cols-12 md:max-w-3xl">
				<div className="grid gap-2 md:col-span-7 xl:col-span-6">
					<Label htmlFor="admin-default-locale">Idioma padrão da loja</Label>
					<div
						id="admin-default-locale"
						className="flex min-h-10 max-w-[22rem] items-center border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-3 text-sm"
						style={{ borderRadius: "var(--sl-radius)" }}
					>
						Português (Brasil) · {DEFAULT_LOCALE}
					</div>
				</div>
				<div className="grid gap-2 md:col-span-5 xl:col-span-4">
					<Label htmlFor="admin-default-country">País padrão</Label>
					<CountrySelect id="admin-default-country" value={defaultCountry} onChange={setDefaultCountry} />
				</div>
			</div>
			<div className="flex items-center gap-3">
				<SlButton variant="primary" onClick={save} disabled={loading || saving}>
					{saving ? "Salvando..." : "Salvar padrões regionais"}
				</SlButton>
				{status ? <p className="text-sm text-[var(--sl-text-muted)]">{status}</p> : null}
			</div>
		</div>
	);
}
