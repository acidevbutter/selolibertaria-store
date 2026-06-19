"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Checkbox } from "@/ui/shadcn/checkbox";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";

type ProviderId = "google" | "facebook" | "instagram";

type ProviderState = {
	enabled: boolean;
	clientId: string;
	clientSecret: string;
	clientSecretMasked: string | null;
	lastUpdatedAt?: string | null;
};

type SettingsPayload = {
	current?: {
		oauthProviders?: Partial<Record<ProviderId, Omit<ProviderState, "clientSecret">>>;
	};
};

const providerMeta: Array<{ id: ProviderId; label: string; helper: string }> = [
	{ id: "google", label: "Google", helper: "Login com Google usando email e perfil da conta." },
	{ id: "facebook", label: "Facebook", helper: "Login social da Meta para acesso na web." },
	{ id: "instagram", label: "Instagram", helper: "Fluxo com complemento de email quando necessário." },
];

function normalizeOAuthText(value: string) {
	return value.trim();
}

function buildInitialState(): Record<ProviderId, ProviderState> {
	return {
		google: { enabled: false, clientId: "", clientSecret: "", clientSecretMasked: null, lastUpdatedAt: null },
		facebook: {
			enabled: false,
			clientId: "",
			clientSecret: "",
			clientSecretMasked: null,
			lastUpdatedAt: null,
		},
		instagram: {
			enabled: false,
			clientId: "",
			clientSecret: "",
			clientSecretMasked: null,
			lastUpdatedAt: null,
		},
	};
}

export default function AdminOAuthProviders() {
	const [providers, setProviders] = useState<Record<ProviderId, ProviderState>>(buildInitialState);
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
				if (!mounted) return;
				const next = buildInitialState();
				for (const meta of providerMeta) {
					const current = data.current?.oauthProviders?.[meta.id];
					next[meta.id] = {
						enabled: current?.enabled === true,
						clientId: current?.clientId ?? "",
						clientSecret: "",
						clientSecretMasked: current?.clientSecretMasked ?? null,
						lastUpdatedAt: current?.lastUpdatedAt ?? null,
					};
				}
				setProviders(next);
			} catch {
				if (mounted) setStatus("Não foi possível carregar os provedores OAuth.");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const providerStatuses = useMemo(
		() =>
			Object.fromEntries(
				providerMeta.map(({ id }) => {
					const provider = providers[id];
					const ready =
						provider.enabled &&
						provider.clientId.trim() &&
						(provider.clientSecret.trim() || provider.clientSecretMasked);
					return [id, ready ? "ready" : provider.enabled ? "incomplete" : "disabled"];
				}),
			) as Record<ProviderId, "ready" | "incomplete" | "disabled">,
		[providers],
	);

	function updateProvider(providerId: ProviderId, patch: Partial<ProviderState>) {
		setProviders((current) => ({
			...current,
			[providerId]: {
				...current[providerId],
				...patch,
			},
		}));
	}

	function formatProviderField(providerId: ProviderId, key: "clientId" | "clientSecret") {
		setProviders((current) => ({
			...current,
			[providerId]: {
				...current[providerId],
				[key]: normalizeOAuthText(current[providerId][key]),
			},
		}));
	}

	async function save() {
		setSaving(true);
		setStatus(null);
		try {
			const payload = {
				oauthProviders: Object.fromEntries(
					providerMeta.map(({ id }) => [
						id,
						{
							enabled: providers[id].enabled,
							clientId: providers[id].clientId,
							clientSecret: providers[id].clientSecret,
						},
					]),
				),
			};
			const res = await fetch("/api/admin/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				setStatus("Não foi possível salvar os provedores OAuth.");
				return;
			}
			const data = (await res.json()) as SettingsPayload;
			const next = buildInitialState();
			for (const meta of providerMeta) {
				const current = data.current?.oauthProviders?.[meta.id];
				next[meta.id] = {
					enabled: current?.enabled === true,
					clientId: current?.clientId ?? "",
					clientSecret: "",
					clientSecretMasked: current?.clientSecretMasked ?? null,
					lastUpdatedAt: current?.lastUpdatedAt ?? null,
				};
			}
			setProviders(next);
			setStatus("Provedores OAuth salvos.");
		} catch {
			setStatus("Não foi possível salvar os provedores OAuth.");
		} finally {
			setSaving(false);
			setTimeout(() => setStatus(null), 3500);
		}
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Ative apenas os provedores já configurados. Os segredos permanecem mascarados depois do salvamento.
			</p>
			<div className="grid gap-4">
				{providerMeta.map((meta) => {
					const provider = providers[meta.id];
					const statusValue = providerStatuses[meta.id];
					return (
						<Card key={meta.id}>
							<CardHeader className="space-y-3">
								<div className="flex items-center justify-between gap-4">
									<div>
										<CardTitle>{meta.label}</CardTitle>
										<p className="text-sm text-muted-foreground">{meta.helper}</p>
									</div>
									<span className="rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
										{statusValue === "ready"
											? "pronto"
											: statusValue === "incomplete"
												? "incompleto"
												: "desativado"}
									</span>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-3">
									<Checkbox
										id={`oauth-${meta.id}-enabled`}
										checked={provider.enabled}
										onCheckedChange={(checked) => updateProvider(meta.id, { enabled: checked === true })}
									/>
									<Label htmlFor={`oauth-${meta.id}-enabled`}>Ativar {meta.label}</Label>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`oauth-${meta.id}-client-id`}>ID do cliente</Label>
									<Input
										id={`oauth-${meta.id}-client-id`}
										value={provider.clientId}
										onChange={(event) => updateProvider(meta.id, { clientId: event.target.value })}
										onBlur={() => formatProviderField(meta.id, "clientId")}
										placeholder="Cole o ID do cliente do provedor"
										autoCapitalize="none"
										autoCorrect="off"
										spellCheck={false}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`oauth-${meta.id}-client-secret`}>Segredo do cliente</Label>
									<Input
										id={`oauth-${meta.id}-client-secret`}
										type="password"
										value={provider.clientSecret}
										onChange={(event) => updateProvider(meta.id, { clientSecret: event.target.value })}
										onBlur={() => formatProviderField(meta.id, "clientSecret")}
										placeholder={
											provider.clientSecretMasked
												? "Preencha apenas para substituir"
												: "Cole o segredo do cliente"
										}
										autoCapitalize="none"
										autoCorrect="off"
										spellCheck={false}
									/>
									{provider.clientSecretMasked ? (
										<p className="text-xs text-muted-foreground">
											Segredo salvo: {provider.clientSecretMasked}
										</p>
									) : (
										<p className="text-xs text-muted-foreground">Nenhum segredo salvo ainda.</p>
									)}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
			<div className="flex items-center gap-3">
				<Button onClick={save} disabled={loading || saving}>
					{saving ? "Salvando..." : "Salvar provedores OAuth"}
				</Button>
				{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
			</div>
		</div>
	);
}
