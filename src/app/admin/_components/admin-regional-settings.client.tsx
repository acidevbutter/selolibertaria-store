"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/i18n/client";
import { type AppLocale, LOCALE_OPTIONS } from "@/i18n/config";
import { CountrySelect } from "@/ui/auth/country-select";
import { Button } from "@/ui/shadcn/button";
import { Label } from "@/ui/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

type SettingsPayload = {
	current?: {
		defaultCountry?: string | null;
		defaultLocale?: AppLocale | null;
	};
};

function formatLocaleOptionLabel(locale: (typeof LOCALE_OPTIONS)[number], displayLocale: string) {
	const languageNames = new Intl.DisplayNames([displayLocale], { type: "language" });
	const regionNames = new Intl.DisplayNames([displayLocale], { type: "region" });
	const languageLabel = languageNames.of(locale.baseLanguage) ?? locale.label;
	const regionLabel = regionNames.of(locale.defaultCountry) ?? locale.defaultCountry;
	return `${languageLabel} (${regionLabel})`;
}

export default function AdminRegionalSettings() {
	const locale = useLocale();
	const [defaultCountry, setDefaultCountry] = useState("BR");
	const [defaultLocale, setDefaultLocale] = useState<AppLocale>("en-US");
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
				if (mounted && data.current?.defaultLocale) setDefaultLocale(data.current.defaultLocale);
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
				body: JSON.stringify({ defaultCountry, defaultLocale }),
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
				<p className="text-sm text-muted-foreground">
					A vitrine pública usa o idioma do dispositivo quando ele coincide com um idioma suportado. O idioma
					padrão abaixo entra como fallback da aplicação.
				</p>
				<p className="text-sm text-muted-foreground">
					O país padrão continua preenchendo telefone e endereço quando a pessoa usuária ainda não tem região
					salva.
				</p>
			</div>
			<div className="grid gap-4 md:grid-cols-12 md:max-w-3xl">
				<div className="grid gap-2 md:col-span-7 xl:col-span-6">
					<Label htmlFor="admin-default-locale">Idioma padrão da loja</Label>
					<Select value={defaultLocale} onValueChange={(value) => setDefaultLocale(value as AppLocale)}>
						<SelectTrigger id="admin-default-locale" className="max-w-[22rem]">
							<SelectValue placeholder="Selecione o idioma" />
						</SelectTrigger>
						<SelectContent>
							{LOCALE_OPTIONS.map((option) => (
								<SelectItem key={option.code} value={option.code}>
									{formatLocaleOptionLabel(option, locale)} · {option.code}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-2 md:col-span-5 xl:col-span-4">
					<Label htmlFor="admin-default-country">País padrão</Label>
					<CountrySelect id="admin-default-country" value={defaultCountry} onChange={setDefaultCountry} />
				</div>
			</div>
			<div className="flex items-center gap-3">
				<Button onClick={save} disabled={loading || saving}>
					{saving ? "Salvando..." : "Salvar padrões regionais"}
				</Button>
				{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
			</div>
		</div>
	);
}
