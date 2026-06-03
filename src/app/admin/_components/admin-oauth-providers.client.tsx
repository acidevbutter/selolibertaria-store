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
	{ id: "google", label: "Google", helper: "OpenID Connect with email and profile access." },
	{ id: "facebook", label: "Facebook", helper: "Meta social OAuth for web login." },
	{ id: "instagram", label: "Instagram", helper: "Flow with email completion when required." },
];

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
				if (mounted) setStatus("Failed to load OAuth providers.");
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
				setStatus("Failed to save OAuth providers.");
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
			setStatus("OAuth providers saved.");
		} catch {
			setStatus("Failed to save OAuth providers.");
		} finally {
			setSaving(false);
			setTimeout(() => setStatus(null), 3500);
		}
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Enable only configured providers. Secrets remain masked after saving.
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
										{statusValue}
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
									<Label htmlFor={`oauth-${meta.id}-enabled`}>Enable {meta.label}</Label>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`oauth-${meta.id}-client-id`}>Client ID</Label>
									<Input
										id={`oauth-${meta.id}-client-id`}
										value={provider.clientId}
										onChange={(event) => updateProvider(meta.id, { clientId: event.target.value })}
										placeholder="Paste the provider client ID"
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`oauth-${meta.id}-client-secret`}>Client secret</Label>
									<Input
										id={`oauth-${meta.id}-client-secret`}
										type="password"
										value={provider.clientSecret}
										onChange={(event) => updateProvider(meta.id, { clientSecret: event.target.value })}
										placeholder={
											provider.clientSecretMasked ? "Enter only to replace it" : "Paste the client secret"
										}
									/>
									{provider.clientSecretMasked ? (
										<p className="text-xs text-muted-foreground">
											Saved secret: {provider.clientSecretMasked}
										</p>
									) : (
										<p className="text-xs text-muted-foreground">No saved secret yet.</p>
									)}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
			<div className="flex items-center gap-3">
				<Button onClick={save} disabled={loading || saving}>
					{saving ? "Saving..." : "Save OAuth providers"}
				</Button>
				{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
			</div>
		</div>
	);
}
