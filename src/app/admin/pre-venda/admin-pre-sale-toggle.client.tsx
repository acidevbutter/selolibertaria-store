"use client";

import { useEffect, useState } from "react";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";

type PreSaleSettings = {
	enabled?: boolean;
	pageEnabled?: boolean;
	popupEnabled?: boolean;
	launchAt?: string | null;
	windowStartAt?: string | null;
	windowEndAt?: string | null;
};
type PreSalePayload = { current?: { preSale?: PreSaleSettings } };

function toLocalInputValue(value?: string | null) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const offset = date.getTimezoneOffset() * 60_000;
	return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(value: string) {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function AdminPreSaleToggle() {
	const [settings, setSettings] = useState<PreSaleSettings>({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		void fetch("/api/admin/settings", { credentials: "include" })
			.then(async (response) => (response.ok ? ((await response.json()) as PreSalePayload) : null))
			.then((data) => {
				if (mounted) setSettings(data?.current?.preSale ?? {});
			})
			.catch(() => {
				if (mounted) setStatus("Não foi possível carregar a pré-venda.");
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});
		return () => {
			mounted = false;
		};
	}, []);

	function update(patch: Partial<PreSaleSettings>) {
		setSettings((current) => ({ ...current, ...patch }));
	}

	async function save() {
		const startAt = toIso(settings.windowStartAt ?? "");
		const endAt = toIso(settings.windowEndAt ?? "");
		if (startAt && endAt && startAt > endAt) {
			setStatus("O fim da janela deve ser posterior ao início.");
			return;
		}
		setSaving(true);
		setStatus(null);
		const payload: PreSaleSettings = {
			pageEnabled: settings.pageEnabled ?? settings.enabled ?? false,
			popupEnabled: settings.popupEnabled ?? false,
			launchAt: toIso(settings.launchAt ?? ""),
			windowStartAt: startAt,
			windowEndAt: endAt,
		};
		try {
			const response = await fetch("/api/admin/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ preSale: payload }),
			});
			if (!response.ok) {
				setStatus("Não foi possível salvar a pré-venda.");
				return;
			}
			setSettings(payload);
			setStatus("Pré-venda salva.");
		} catch {
			setStatus("Não foi possível salvar a pré-venda.");
		} finally {
			setSaving(false);
		}
	}

	const pageEnabled = settings.pageEnabled ?? settings.enabled ?? false;
	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2">
				<ToggleField
					checked={pageEnabled}
					description="Publica a rota /pre-venda/little-fish-big-fish dentro da janela configurada."
					disabled={loading || saving}
					label="Página pública"
					onToggle={() => update({ pageEnabled: !pageEnabled })}
				/>
				<ToggleField
					checked={settings.popupEnabled ?? false}
					description="Mostra o modal de contagem em toda a loja, mesmo que a landing esteja desligada."
					disabled={loading || saving}
					label="Modal no site"
					onToggle={() => update({ popupEnabled: !(settings.popupEnabled ?? false) })}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<DateField
					label="Data de estreia"
					helper="Alimenta a contagem regressiva."
					value={toLocalInputValue(settings.launchAt)}
					onChange={(launchAt) => update({ launchAt })}
				/>
				<DateField
					label="Início da janela"
					helper="Antes desta data, página e modal ficam inativos."
					value={toLocalInputValue(settings.windowStartAt)}
					onChange={(windowStartAt) => update({ windowStartAt })}
				/>
				<DateField
					label="Fim da janela"
					helper="Depois desta data, página e modal ficam inativos."
					value={toLocalInputValue(settings.windowEndAt)}
					onChange={(windowEndAt) => update({ windowEndAt })}
				/>
			</div>

			<div className="flex flex-wrap items-center gap-3 border-t border-[color:var(--editorial-border)] pt-4">
				<Button type="button" onClick={() => void save()} disabled={loading || saving}>
					{saving ? "Salvando..." : "Salvar pré-venda"}
				</Button>
				{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
			</div>
		</div>
	);
}

function ToggleField({
	checked,
	description,
	disabled,
	label,
	onToggle,
}: {
	checked: boolean;
	description: string;
	disabled: boolean;
	label: string;
	onToggle: () => void;
}) {
	return (
		<div className="flex items-start justify-between gap-4 border border-[color:var(--editorial-border)] p-4">
			<div>
				<p className="text-sm font-medium">{label}</p>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
			<Button type="button" variant={checked ? "default" : "outline"} disabled={disabled} onClick={onToggle}>
				{checked ? "Ativada" : "Desativada"}
			</Button>
		</div>
	);
}

function DateField({
	label,
	helper,
	value,
	onChange,
}: {
	label: string;
	helper: string;
	value: string;
	onChange: (value: string | null) => void;
}) {
	return (
		<label className="space-y-1.5">
			<span className="block text-sm font-medium">{label}</span>
			<Input type="datetime-local" value={value} onChange={(event) => onChange(event.target.value || null)} />
			<span className="block text-xs text-muted-foreground">{helper}</span>
		</label>
	);
}
