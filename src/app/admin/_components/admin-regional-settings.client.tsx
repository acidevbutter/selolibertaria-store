"use client";

import { useEffect, useState } from "react";
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

export default function AdminRegionalSettings() {
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
				if (mounted) setStatus("Failed to load regional defaults.");
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
				setStatus("Failed to save regional defaults.");
				return;
			}
			setStatus("Regional defaults saved.");
		} catch {
			setStatus("Failed to save regional defaults.");
		} finally {
			setSaving(false);
			setTimeout(() => setStatus(null), 3500);
		}
	}

	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<p className="text-sm text-muted-foreground">
					Visitors use their device language when it matches a supported locale. The default language below is
					used as the selolibertaria fallback.
				</p>
				<p className="text-sm text-muted-foreground">
					The default country still seeds phone and address fields whenever a user has no saved region yet.
				</p>
			</div>
			<div className="grid gap-4 md:grid-cols-12 md:max-w-3xl">
				<div className="grid gap-2 md:col-span-7 xl:col-span-6">
					<Label htmlFor="admin-default-locale">Default selolibertaria language</Label>
					<Select value={defaultLocale} onValueChange={(value) => setDefaultLocale(value as AppLocale)}>
						<SelectTrigger id="admin-default-locale" className="max-w-[22rem]">
							<SelectValue placeholder="Select language" />
						</SelectTrigger>
						<SelectContent>
							{LOCALE_OPTIONS.map((locale) => (
								<SelectItem key={locale.code} value={locale.code}>
									{locale.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-2 md:col-span-5 xl:col-span-4">
					<Label htmlFor="admin-default-country">Default country</Label>
					<CountrySelect id="admin-default-country" value={defaultCountry} onChange={setDefaultCountry} />
				</div>
			</div>
			<div className="flex items-center gap-3">
				<Button onClick={save} disabled={loading || saving}>
					{saving ? "Saving..." : "Save regional defaults"}
				</Button>
				{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
			</div>
		</div>
	);
}
