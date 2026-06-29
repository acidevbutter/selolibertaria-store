"use client";

import { useEffect, useState } from "react";
import { Button } from "@/ui/shadcn/button";
import { Checkbox } from "@/ui/shadcn/checkbox";
import { Label } from "@/ui/shadcn/label";

type SettingsPayload = {
	current?: {
		shippingEnabled?: boolean;
	};
};

export default function AdminShippingProviders() {
	const [shippingEnabled, setShippingEnabled] = useState(true);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				const response = await fetch("/api/admin/settings", {
					credentials: "include",
				});
				if (!response.ok) return;

				const data = (await response.json()) as SettingsPayload;
				if (!mounted) return;

				setShippingEnabled(data.current?.shippingEnabled !== false);
			} catch {
				if (mounted) {
					setStatus("Não foi possível carregar as configurações de frete.");
				}
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
			const response = await fetch("/api/admin/settings", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					shippingEnabled,
				}),
			});

			if (!response.ok) {
				setStatus("Não foi possível salvar as configurações de frete.");
				return;
			}

			const data = (await response.json()) as SettingsPayload;
			setShippingEnabled(data.current?.shippingEnabled !== false);
			setStatus("Configurações de frete salvas.");
		} catch {
			setStatus("Não foi possível salvar as configurações de frete.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h2 className="text-xl font-semibold">Frete</h2>
				<p className="max-w-3xl text-sm text-muted-foreground">
					A cotação usa o Melhor Envio configurado no ambiente da aplicação.
				</p>
			</div>

			<div className="flex items-center gap-3">
				<Checkbox
					id="shipping-enabled"
					checked={shippingEnabled}
					onCheckedChange={(checked) => setShippingEnabled(checked === true)}
					disabled={saving || loading}
				/>
				<Label htmlFor="shipping-enabled">Ativar cálculo de frete</Label>
			</div>

			<div className="flex flex-wrap gap-3">
				<Button type="button" onClick={save} disabled={saving || loading}>
					{saving ? "Salvando..." : "Salvar frete"}
				</Button>
			</div>

			{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
		</div>
	);
}
