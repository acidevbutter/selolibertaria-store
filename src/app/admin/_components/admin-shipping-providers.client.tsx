"use client";

import { useEffect, useState } from "react";
import { Button } from "@/ui/shadcn/button";
import { Checkbox } from "@/ui/shadcn/checkbox";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

type ShippingMelhorEnvioPayload = {
	environment?: "sandbox" | "production" | null;
	baseUrl?: string | null;
	originPostalCode?: string | null;
	defaultWeightGrams?: number | null;
	defaultLengthCm?: number | null;
	defaultWidthCm?: number | null;
	defaultHeightCm?: number | null;
	userAgent?: string | null;
	contactEmail?: string | null;
	supportedCountry?: "BR" | null;
	requiresPostalCode?: boolean;
};

type SettingsPayload = {
	current?: {
		shippingEnabled?: boolean;
		shippingMelhorEnvio?: ShippingMelhorEnvioPayload | null;
	};
};

type ShippingMelhorEnvioFormState = {
	environment: "sandbox" | "production";
	baseUrl: string;
	originPostalCode: string;
	defaultWeightGrams: string;
	defaultLengthCm: string;
	defaultWidthCm: string;
	defaultHeightCm: string;
	userAgent: string;
	contactEmail: string;
	supportedCountry: "BR";
	requiresPostalCode: boolean;
};

const DEFAULT_FORM_STATE: ShippingMelhorEnvioFormState = {
	environment: "sandbox",
	baseUrl: "",
	originPostalCode: "",
	defaultWeightGrams: "300",
	defaultLengthCm: "20",
	defaultWidthCm: "20",
	defaultHeightCm: "10",
	userAgent: "",
	contactEmail: "",
	supportedCountry: "BR",
	requiresPostalCode: true,
};

function buildFormState(value?: ShippingMelhorEnvioPayload | null): ShippingMelhorEnvioFormState {
	return {
		environment: value?.environment === "production" ? "production" : "sandbox",
		baseUrl: value?.baseUrl ?? "",
		originPostalCode: value?.originPostalCode ?? "",
		defaultWeightGrams: String(value?.defaultWeightGrams ?? 300),
		defaultLengthCm: String(value?.defaultLengthCm ?? 20),
		defaultWidthCm: String(value?.defaultWidthCm ?? 20),
		defaultHeightCm: String(value?.defaultHeightCm ?? 10),
		userAgent: value?.userAgent ?? "",
		contactEmail: value?.contactEmail ?? "",
		supportedCountry: "BR",
		requiresPostalCode: true,
	};
}

export default function AdminShippingProviders() {
	const [shippingEnabled, setShippingEnabled] = useState(true);
	const [form, setForm] = useState<ShippingMelhorEnvioFormState>(DEFAULT_FORM_STATE);
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
				setForm(buildFormState(data.current?.shippingMelhorEnvio));
			} catch {
				if (mounted) {
					setStatus("Não foi possível carregar configurações de frete.");
				}
			} finally {
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	function updateField<K extends keyof ShippingMelhorEnvioFormState>(
		field: K,
		value: ShippingMelhorEnvioFormState[K],
	) {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	}

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
					shippingMelhorEnvio: {
						environment: form.environment,
						baseUrl: form.baseUrl,
						originPostalCode: form.originPostalCode,
						defaultWeightGrams: form.defaultWeightGrams,
						defaultLengthCm: form.defaultLengthCm,
						defaultWidthCm: form.defaultWidthCm,
						defaultHeightCm: form.defaultHeightCm,
						userAgent: form.userAgent,
						contactEmail: form.contactEmail,
					},
				}),
			});

			if (!response.ok) {
				setStatus("Não foi possível salvar configurações de frete.");
				return;
			}

			const data = (await response.json()) as SettingsPayload;
			setShippingEnabled(data.current?.shippingEnabled !== false);
			setForm(buildFormState(data.current?.shippingMelhorEnvio));
			setStatus("Configurações de frete salvas.");
		} catch {
			setStatus("Não foi possível salvar configurações de frete.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<p className="text-sm text-muted-foreground">
					Configure apenas a operação do Melhor Envio neste bloco. O token continua no ambiente do servidor e
					nunca é salvo no admin.
				</p>
			</div>

			<div className="flex items-center gap-3 rounded-md border border-border/70 bg-background/70 px-4 py-3">
				<Checkbox
					id="shipping-enabled"
					checked={shippingEnabled}
					onCheckedChange={(checked) => setShippingEnabled(checked === true)}
					disabled={saving || loading}
				/>
				<div className="space-y-1">
					<Label htmlFor="shipping-enabled">Ativar cálculo de frete</Label>
					<p className="text-xs text-muted-foreground">
						Se desligar, a cotação fica pausada sem afetar a retirada na loja.
					</p>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="grid gap-2">
					<Label htmlFor="shipping-environment">Ambiente</Label>
					<Select
						value={form.environment}
						onValueChange={(value: "sandbox" | "production") => updateField("environment", value)}
						disabled={saving || loading}
					>
						<SelectTrigger id="shipping-environment">
							<SelectValue placeholder="Selecione o ambiente" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="sandbox">sandbox</SelectItem>
							<SelectItem value="production">production</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="shipping-base-url">URL base</Label>
					<Input
						id="shipping-base-url"
						value={form.baseUrl}
						onChange={(event) => updateField("baseUrl", event.target.value)}
						placeholder="https://www.melhorenvio.com.br/api/v2"
						disabled={saving || loading}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="shipping-origin-postal-code">CEP de origem</Label>
					<Input
						id="shipping-origin-postal-code"
						value={form.originPostalCode}
						onChange={(event) => updateField("originPostalCode", event.target.value)}
						placeholder="01310-100"
						disabled={saving || loading}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="shipping-default-weight">Peso padrão (g)</Label>
					<Input
						id="shipping-default-weight"
						inputMode="numeric"
						value={form.defaultWeightGrams}
						onChange={(event) => updateField("defaultWeightGrams", event.target.value)}
						disabled={saving || loading}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="shipping-default-length">Comprimento padrão (cm)</Label>
					<Input
						id="shipping-default-length"
						inputMode="numeric"
						value={form.defaultLengthCm}
						onChange={(event) => updateField("defaultLengthCm", event.target.value)}
						disabled={saving || loading}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="shipping-default-width">Largura padrão (cm)</Label>
					<Input
						id="shipping-default-width"
						inputMode="numeric"
						value={form.defaultWidthCm}
						onChange={(event) => updateField("defaultWidthCm", event.target.value)}
						disabled={saving || loading}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="shipping-default-height">Altura padrão (cm)</Label>
					<Input
						id="shipping-default-height"
						inputMode="numeric"
						value={form.defaultHeightCm}
						onChange={(event) => updateField("defaultHeightCm", event.target.value)}
						disabled={saving || loading}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="shipping-user-agent">User-Agent técnico</Label>
					<Input
						id="shipping-user-agent"
						value={form.userAgent}
						onChange={(event) => updateField("userAgent", event.target.value)}
						placeholder="Selo Libertária (tech@selolibertaria.com)"
						disabled={saving || loading}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="shipping-contact-email">E-mail técnico de contato</Label>
					<Input
						id="shipping-contact-email"
						type="email"
						value={form.contactEmail}
						onChange={(event) => updateField("contactEmail", event.target.value)}
						placeholder="tech@selolibertaria.com"
						disabled={saving || loading}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="shipping-supported-country">País suportado</Label>
					<Input id="shipping-supported-country" value={form.supportedCountry} readOnly disabled />
				</div>

				<div className="grid gap-2">
					<Label htmlFor="shipping-requires-postal-code">Exige CEP</Label>
					<Input
						id="shipping-requires-postal-code"
						value={form.requiresPostalCode ? "true" : "false"}
						readOnly
						disabled
					/>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<Button type="button" onClick={save} disabled={saving || loading}>
					{saving ? "Salvando..." : "Salvar frete"}
				</Button>
				{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
			</div>
		</div>
	);
}
