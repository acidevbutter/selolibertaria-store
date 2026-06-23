"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizePostalCode } from "@/lib/location/countries";
import type {
	ShippingProviderAuthType,
	ShippingProviderEnvironment,
	ShippingProviderKind,
} from "@/lib/settings";
import {
	getShippingProviderPreset,
	SHIPPING_PROVIDER_PRESETS,
	type ShippingCredentialField,
} from "@/lib/shipping-provider-presets";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Checkbox } from "@/ui/shadcn/checkbox";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

type ShippingMode = "flat" | "http";
type EndpointState = {
	quote: string;
	shipment: string;
	tracking: string;
	token: string;
};

type ShippingProviderState = {
	code: string;
	label: string;
	enabled: boolean;
	priority: number;
	mode: ShippingMode;
	kind: ShippingProviderKind;
	authType: ShippingProviderAuthType;
	baseUrl: string;
	environment: ShippingProviderEnvironment;
	endpoints: EndpointState;
	credentials: Record<string, string>;
	credentialsMasked: Record<string, string>;
	serviceCode: string;
	serviceName: string;
	fixedAmount: string;
	estimatedDays: string;
	supportedCountries: string;
	requiresPostalCode: boolean;
	defaultWeightGrams: string;
	defaultLengthCm: string;
	defaultWidthCm: string;
	defaultHeightCm: string;
	lastUpdatedAt?: string | null;
};

type SettingsPayload = {
	current?: {
		shippingEnabled?: boolean;
		shippingProviders?: Array<
			Partial<Omit<ShippingProviderState, "credentials" | "credentialsMasked" | "supportedCountries">> & {
				credentialsMasked?: Record<string, string> | null;
				supportedCountries?: string[];
			}
		>;
	};
};

function buildProviderFromPreset(kind: ShippingProviderKind, index = 0): ShippingProviderState {
	const preset = getShippingProviderPreset(kind);
	return {
		code: `${kind}-${index + 1}`,
		label: preset.label,
		enabled: false,
		priority: index,
		mode: kind === "custom" ? "flat" : "http",
		kind,
		authType: preset.defaultAuthType,
		baseUrl: preset.defaultBaseUrl,
		environment: preset.defaultEnvironment,
		endpoints: {
			quote: preset.defaultEndpoints.quote ?? "",
			shipment: preset.defaultEndpoints.shipment ?? "",
			tracking: preset.defaultEndpoints.tracking ?? "",
			token: preset.defaultEndpoints.token ?? "",
		},
		credentials: {},
		credentialsMasked: {},
		serviceCode: "",
		serviceName: "",
		fixedAmount: "",
		estimatedDays: "",
		supportedCountries: preset.defaultSupportedCountries.join(", "),
		requiresPostalCode: preset.defaultRequiresPostalCode,
		defaultWeightGrams: "300",
		defaultLengthCm: "20",
		defaultWidthCm: "20",
		defaultHeightCm: "10",
		lastUpdatedAt: null,
	};
}

function buildInitialState(doc?: SettingsPayload["current"]): ShippingProviderState[] {
	const providers = doc?.shippingProviders ?? [];
	if (providers.length === 0) return [buildProviderFromPreset("correios", 0)];
	return providers.map((provider, index) => {
		const kind = provider?.kind ?? "custom";
		const preset = getShippingProviderPreset(kind);
		const base = buildProviderFromPreset(kind, index);
		return {
			...base,
			code: provider?.code ?? base.code,
			label: provider?.label ?? base.label,
			enabled: provider?.enabled === true,
			priority: typeof provider?.priority === "number" ? provider.priority : index,
			mode: provider?.mode === "flat" ? ("flat" as const) : ("http" as const),
			authType: provider?.authType ?? preset.defaultAuthType,
			baseUrl: provider?.baseUrl ?? base.baseUrl,
			environment: provider?.environment === "production" ? "production" : preset.defaultEnvironment,
			endpoints: {
				quote: provider?.endpoints?.quote ?? base.endpoints.quote,
				shipment: provider?.endpoints?.shipment ?? base.endpoints.shipment,
				tracking: provider?.endpoints?.tracking ?? base.endpoints.tracking,
				token: provider?.endpoints?.token ?? base.endpoints.token,
			},
			credentials: {},
			credentialsMasked: provider?.credentialsMasked ?? {},
			serviceCode: provider?.serviceCode ?? "",
			serviceName: provider?.serviceName ?? "",
			fixedAmount: typeof provider?.fixedAmount === "number" ? String(provider.fixedAmount) : "",
			estimatedDays: typeof provider?.estimatedDays === "number" ? String(provider.estimatedDays) : "",
			supportedCountries: Array.isArray(provider?.supportedCountries)
				? provider.supportedCountries.join(", ")
				: base.supportedCountries,
			requiresPostalCode: provider?.requiresPostalCode === true,
			defaultWeightGrams:
				typeof provider?.defaultWeightGrams === "number"
					? String(provider.defaultWeightGrams)
					: base.defaultWeightGrams,
			defaultLengthCm:
				typeof provider?.defaultLengthCm === "number"
					? String(provider.defaultLengthCm)
					: base.defaultLengthCm,
			defaultWidthCm:
				typeof provider?.defaultWidthCm === "number" ? String(provider.defaultWidthCm) : base.defaultWidthCm,
			defaultHeightCm:
				typeof provider?.defaultHeightCm === "number"
					? String(provider.defaultHeightCm)
					: base.defaultHeightCm,
			lastUpdatedAt: provider?.lastUpdatedAt ?? null,
		};
	});
}

function getRequiredCredentialKeys(fields: ShippingCredentialField[]) {
	return fields.filter((field) => field.required).map((field) => field.key);
}

function formatProviderCode(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9\s_-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function formatCountryCode(value: string) {
	return value
		.replace(/[^a-z]/gi, "")
		.slice(0, 2)
		.toUpperCase();
}

function formatSupportedCountries(value: string) {
	return value
		.split(/[;,]+/)
		.map((entry) => formatCountryCode(entry))
		.filter(Boolean)
		.join(", ");
}

function formatBaseUrl(value: string) {
	return value.trim().replace(/\/+$/g, "");
}

function formatEndpointValue(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return "";
	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function resolveCredentialCountry(provider: ShippingProviderState, key: string) {
	if (key === "originPostalCode") return provider.credentials.originCountry || "BR";
	if (key === "fromPostalCode") return provider.credentials.fromCountry || "US";
	return "BR";
}

function formatCredentialValue(provider: ShippingProviderState, key: string, value: string) {
	if (key === "originCountry" || key === "fromCountry") return formatCountryCode(value);
	if (key === "originPostalCode" || key === "fromPostalCode") {
		return normalizePostalCode(resolveCredentialCountry(provider, key), value);
	}
	return value.trim();
}

export default function AdminShippingProviders() {
	const [providers, setProviders] = useState<ShippingProviderState[]>(() => [
		buildProviderFromPreset("correios", 0),
	]);
	const [shippingEnabled, setShippingEnabled] = useState(true);
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
				if (mounted) {
					setShippingEnabled(data.current?.shippingEnabled !== false);
					setProviders(buildInitialState(data.current));
				}
			} catch {
				if (mounted) setStatus("Não foi possível carregar os provedores de frete.");
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
			providers.map((provider) => {
				if (!provider.enabled) return "disabled";
				if (provider.mode === "flat") {
					return Number.isFinite(Number(provider.fixedAmount)) ? "ready" : "incomplete";
				}
				const preset = getShippingProviderPreset(provider.kind);
				const requiredKeys = getRequiredCredentialKeys(preset.credentialFields);
				const hasCredentials = requiredKeys.every((key) => {
					const value = provider.credentials[key]?.trim();
					const masked = provider.credentialsMasked[key]?.trim();
					return Boolean(value || masked);
				});
				return provider.baseUrl.trim() && provider.endpoints.quote.trim() && hasCredentials
					? "ready"
					: "incomplete";
			}),
		[providers],
	);

	function updateProvider(index: number, patch: Partial<ShippingProviderState>) {
		setProviders((current) =>
			current.map((provider, currentIndex) =>
				currentIndex === index ? { ...provider, ...patch } : provider,
			),
		);
	}

	function updateProviderCredential(index: number, key: string, value: string) {
		setProviders((current) =>
			current.map((provider, currentIndex) =>
				currentIndex === index
					? {
							...provider,
							credentials: {
								...provider.credentials,
								[key]: value,
							},
						}
					: provider,
			),
		);
	}

	function formatProviderField(index: number, patch: Partial<ShippingProviderState>) {
		setProviders((current) =>
			current.map((provider, currentIndex) =>
				currentIndex === index ? { ...provider, ...patch } : provider,
			),
		);
	}

	function formatProviderCredential(index: number, key: string) {
		setProviders((current) =>
			current.map((provider, currentIndex) => {
				if (currentIndex !== index) return provider;
				return {
					...provider,
					credentials: {
						...provider.credentials,
						[key]: formatCredentialValue(provider, key, provider.credentials[key] ?? ""),
					},
				};
			}),
		);
	}

	function updateProviderEndpoint(index: number, key: keyof EndpointState, value: string) {
		setProviders((current) =>
			current.map((provider, currentIndex) =>
				currentIndex === index
					? {
							...provider,
							endpoints: {
								...provider.endpoints,
								[key]: value,
							},
						}
					: provider,
			),
		);
	}

	function updateProviderKind(index: number, kind: ShippingProviderKind) {
		const next = buildProviderFromPreset(kind, index);
		setProviders((current) =>
			current.map((provider, currentIndex) =>
				currentIndex === index
					? {
							...provider,
							kind,
							mode: kind === "custom" ? provider.mode : "http",
							authType: next.authType,
							baseUrl: next.baseUrl,
							environment: next.environment,
							endpoints: next.endpoints,
							credentials: {},
							credentialsMasked: {},
							supportedCountries: next.supportedCountries,
							requiresPostalCode: next.requiresPostalCode,
						}
					: provider,
			),
		);
	}

	function addProvider() {
		setProviders((current) => [...current, buildProviderFromPreset("custom", current.length)]);
	}

	function removeProvider(index: number) {
		setProviders((current) => {
			const next = current.filter((_, currentIndex) => currentIndex !== index);
			return next.length > 0 ? next : [buildProviderFromPreset("correios", 0)];
		});
	}

	async function save() {
		setSaving(true);
		setStatus(null);
		try {
			const payload = {
				shippingEnabled,
				shippingProviders: providers.map((provider, index) => ({
					code: provider.code.trim(),
					label: provider.label.trim(),
					enabled: provider.enabled,
					priority: Number.isFinite(Number(provider.priority)) ? Number(provider.priority) : index,
					mode: provider.mode,
					kind: provider.kind,
					authType: provider.authType,
					baseUrl: provider.baseUrl.trim(),
					environment: provider.environment,
					endpoints: {
						quote: provider.endpoints.quote.trim(),
						shipment: provider.endpoints.shipment.trim(),
						tracking: provider.endpoints.tracking.trim(),
						token: provider.endpoints.token.trim(),
					},
					credentials: Object.fromEntries(
						Object.entries(provider.credentials)
							.map(([key, value]) => [key, value.trim()] as const)
							.filter(([, value]) => value.length > 0),
					),
					serviceCode: provider.serviceCode.trim(),
					serviceName: provider.serviceName.trim(),
					fixedAmount: provider.fixedAmount.trim(),
					estimatedDays: provider.estimatedDays.trim(),
					supportedCountries: provider.supportedCountries
						.split(",")
						.map((entry) => entry.trim().toUpperCase())
						.filter((entry) => /^[A-Z]{2}$/.test(entry)),
					requiresPostalCode: provider.requiresPostalCode,
					defaultWeightGrams: provider.defaultWeightGrams.trim(),
					defaultLengthCm: provider.defaultLengthCm.trim(),
					defaultWidthCm: provider.defaultWidthCm.trim(),
					defaultHeightCm: provider.defaultHeightCm.trim(),
				})),
			};
			const res = await fetch("/api/admin/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				setStatus("Não foi possível salvar os provedores de frete.");
				return;
			}
			const data = (await res.json()) as SettingsPayload;
			setShippingEnabled(data.current?.shippingEnabled !== false);
			setProviders(buildInitialState(data.current));
			setStatus("Provedores de frete salvos.");
		} catch {
			setStatus("Não foi possível salvar os provedores de frete.");
		} finally {
			setSaving(false);
			setTimeout(() => setStatus(null), 3500);
		}
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Configure os provedores por transportadora com credenciais, origem e ordem de reserva.
			</p>
			<div className="flex items-center gap-3 rounded-lg border p-4">
				<Checkbox
					id="shipping-enabled"
					checked={shippingEnabled}
					onCheckedChange={(checked) => setShippingEnabled(checked === true)}
					disabled={saving || loading}
				/>
				<div className="space-y-1">
					<Label htmlFor="shipping-enabled">Ativar cálculo de frete</Label>
					<p className="text-sm text-muted-foreground">
						Quando desativado, checkout e carrinho param de calcular frete independentemente de provedores
						manuais ou via API.
					</p>
				</div>
			</div>
			<div className="space-y-4">
				{providers.map((provider, index) => {
					const statusValue = providerStatuses[index];
					const preset = getShippingProviderPreset(provider.kind);
					return (
						<Card key={`${provider.code}-${index}`}>
							<CardHeader className="space-y-3">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<CardTitle>{provider.label || `Provedor ${index + 1}`}</CardTitle>
										<p className="text-sm text-muted-foreground">{preset.description}</p>
									</div>
									<div className="flex items-center gap-2">
										<span className="rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
											{statusValue === "ready"
												? "Pronto"
												: statusValue === "incomplete"
													? "Incompleto"
													: "Desativado"}
										</span>
										<Button type="button" variant="outline" onClick={() => removeProvider(index)}>
											Remover
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-5">
								<div className="flex items-center gap-3">
									<Checkbox
										id={`shipping-${index}-enabled`}
										checked={provider.enabled}
										onCheckedChange={(checked) => updateProvider(index, { enabled: checked === true })}
									/>
									<Label htmlFor={`shipping-${index}-enabled`}>Ativar provedor</Label>
								</div>

								<div className="grid gap-4 md:grid-cols-12">
									<div className="grid gap-2 md:col-span-4 xl:col-span-3">
										<Label htmlFor={`shipping-${index}-kind`}>Tipo de provedor</Label>
										<Select
											value={provider.kind}
											onValueChange={(value) => updateProviderKind(index, value as ShippingProviderKind)}
										>
											<SelectTrigger id={`shipping-${index}-kind`} className="max-w-[15rem]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{Object.values(SHIPPING_PROVIDER_PRESETS).map((option) => (
													<SelectItem key={option.kind} value={option.kind}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="grid gap-2 md:col-span-4 xl:col-span-3">
										<Label htmlFor={`shipping-${index}-mode`}>Modo de cálculo</Label>
										<Select
											value={provider.mode}
											onValueChange={(value) => updateProvider(index, { mode: value as ShippingMode })}
											disabled={provider.kind !== "custom"}
										>
											<SelectTrigger id={`shipping-${index}-mode`} className="max-w-[12rem]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="flat">Valor fixo</SelectItem>
												<SelectItem value="http">API HTTP</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="grid gap-2 md:col-span-4 xl:col-span-2">
										<Label htmlFor={`shipping-${index}-code`}>Código</Label>
										<Input
											id={`shipping-${index}-code`}
											value={provider.code}
											onChange={(event) =>
												updateProvider(index, { code: formatProviderCode(event.target.value) })
											}
											onBlur={(event) =>
												formatProviderField(index, { code: formatProviderCode(event.target.value) })
											}
											placeholder="correios"
											className="max-w-[10rem]"
											autoCapitalize="none"
											autoCorrect="off"
											spellCheck={false}
										/>
									</div>
									<div className="grid gap-2 md:col-span-6 xl:col-span-4">
										<Label htmlFor={`shipping-${index}-label`}>Nome visível</Label>
										<Input
											id={`shipping-${index}-label`}
											value={provider.label}
											onChange={(event) => updateProvider(index, { label: event.target.value })}
											placeholder="Correios"
											className="max-w-[18rem]"
										/>
									</div>
									<div className="grid gap-2 md:col-span-3 xl:col-span-1">
										<Label htmlFor={`shipping-${index}-priority`}>Prioridade</Label>
										<Input
											id={`shipping-${index}-priority`}
											type="number"
											value={provider.priority}
											onChange={(event) =>
												updateProvider(index, { priority: Number.parseInt(event.target.value || "0", 10) })
											}
											className="max-w-[6rem]"
										/>
									</div>
								</div>

								{provider.mode === "http" ? (
									<div className="space-y-4 rounded-lg border p-4">
										<div className="grid gap-4 md:grid-cols-12">
											<div className="grid gap-2 md:col-span-8 xl:col-span-7">
												<Label htmlFor={`shipping-${index}-base-url`}>URL base</Label>
												<Input
													id={`shipping-${index}-base-url`}
													value={provider.baseUrl}
													onChange={(event) => updateProvider(index, { baseUrl: event.target.value })}
													onBlur={(event) =>
														formatProviderField(index, { baseUrl: formatBaseUrl(event.target.value) })
													}
													placeholder="https://api.correios.com.br"
													className="max-w-[34rem]"
													autoCapitalize="none"
													autoCorrect="off"
													spellCheck={false}
												/>
											</div>
											<div className="grid gap-2 md:col-span-4 xl:col-span-3">
												<Label htmlFor={`shipping-${index}-environment`}>Ambiente</Label>
												<Select
													value={provider.environment}
													onValueChange={(value) =>
														updateProvider(index, {
															environment: value as ShippingProviderEnvironment,
														})
													}
												>
													<SelectTrigger id={`shipping-${index}-environment`} className="max-w-[12rem]">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="sandbox">Teste</SelectItem>
														<SelectItem value="production">Produção</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>

										<div className="grid gap-4 md:grid-cols-12">
											<div className="grid gap-2 md:col-span-6 xl:col-span-5">
												<Label htmlFor={`shipping-${index}-quote`}>Endpoint de cotação</Label>
												<Input
													id={`shipping-${index}-quote`}
													value={provider.endpoints.quote}
													onChange={(event) => updateProviderEndpoint(index, "quote", event.target.value)}
													onBlur={(event) =>
														updateProviderEndpoint(index, "quote", formatEndpointValue(event.target.value))
													}
													placeholder="/preco/v1/nacional"
													className="max-w-[22rem]"
													autoCapitalize="none"
													autoCorrect="off"
													spellCheck={false}
												/>
											</div>
											<div className="grid gap-2 md:col-span-6 xl:col-span-5">
												<Label htmlFor={`shipping-${index}-token`}>Endpoint de token</Label>
												<Input
													id={`shipping-${index}-token`}
													value={provider.endpoints.token}
													onChange={(event) => updateProviderEndpoint(index, "token", event.target.value)}
													onBlur={(event) =>
														updateProviderEndpoint(index, "token", formatEndpointValue(event.target.value))
													}
													placeholder="/token/v1/autentica/contrato"
													className="max-w-[22rem]"
													autoCapitalize="none"
													autoCorrect="off"
													spellCheck={false}
												/>
											</div>
											<div className="grid gap-2 md:col-span-6 xl:col-span-5">
												<Label htmlFor={`shipping-${index}-shipment`}>Endpoint de envio</Label>
												<Input
													id={`shipping-${index}-shipment`}
													value={provider.endpoints.shipment}
													onChange={(event) => updateProviderEndpoint(index, "shipment", event.target.value)}
													onBlur={(event) =>
														updateProviderEndpoint(index, "shipment", formatEndpointValue(event.target.value))
													}
													placeholder="/shipment"
													className="max-w-[22rem]"
													autoCapitalize="none"
													autoCorrect="off"
													spellCheck={false}
												/>
											</div>
											<div className="grid gap-2 md:col-span-6 xl:col-span-5">
												<Label htmlFor={`shipping-${index}-tracking`}>Endpoint de rastreio</Label>
												<Input
													id={`shipping-${index}-tracking`}
													value={provider.endpoints.tracking}
													onChange={(event) => updateProviderEndpoint(index, "tracking", event.target.value)}
													onBlur={(event) =>
														updateProviderEndpoint(index, "tracking", formatEndpointValue(event.target.value))
													}
													placeholder="/tracking"
													className="max-w-[22rem]"
													autoCapitalize="none"
													autoCorrect="off"
													spellCheck={false}
												/>
											</div>
										</div>

										<div className="grid gap-4 md:grid-cols-12">
											{preset.credentialFields.map((field) => {
												const fieldId = `shipping-${index}-credential-${field.key}`;
												const maskedValue = provider.credentialsMasked[field.key];
												return (
													<div key={field.key} className="grid gap-2 md:col-span-6 xl:col-span-5">
														<Label htmlFor={fieldId}>{field.label}</Label>
														<Input
															id={fieldId}
															type={field.secret ? "password" : "text"}
															value={provider.credentials[field.key] ?? ""}
															onChange={(event) =>
																updateProviderCredential(index, field.key, event.target.value)
															}
															onBlur={() => formatProviderCredential(index, field.key)}
															placeholder={maskedValue ? `Valor salvo: ${maskedValue}` : field.placeholder}
															className="max-w-[22rem]"
															autoCapitalize="none"
															autoCorrect="off"
															spellCheck={false}
														/>
														{field.helpText ? (
															<p className="text-xs text-muted-foreground">{field.helpText}</p>
														) : maskedValue ? (
															<p className="text-xs text-muted-foreground">Valor salvo: {maskedValue}</p>
														) : null}
													</div>
												);
											})}
										</div>
									</div>
								) : null}

								<div className="grid gap-4 md:grid-cols-12">
									<div className="grid gap-2 md:col-span-4 xl:col-span-3">
										<Label htmlFor={`shipping-${index}-service-code`}>Código padrão do serviço</Label>
										<Input
											id={`shipping-${index}-service-code`}
											value={provider.serviceCode}
											onChange={(event) =>
												updateProvider(index, {
													serviceCode: event.target.value.toUpperCase().replace(/\s+/g, ""),
												})
											}
											onBlur={(event) =>
												formatProviderField(index, {
													serviceCode: event.target.value.toUpperCase().replace(/\s+/g, ""),
												})
											}
											placeholder={provider.kind === "correios" ? "03220" : "COD123"}
											className="max-w-[10rem]"
											autoCapitalize="characters"
											autoCorrect="off"
											spellCheck={false}
										/>
									</div>
									<div className="grid gap-2 md:col-span-5 xl:col-span-4">
										<Label htmlFor={`shipping-${index}-service-name`}>Nome padrão do serviço</Label>
										<Input
											id={`shipping-${index}-service-name`}
											value={provider.serviceName}
											onChange={(event) => updateProvider(index, { serviceName: event.target.value })}
											placeholder="SEDEX"
											className="max-w-[16rem]"
										/>
									</div>
									<div className="grid gap-2 md:col-span-3 xl:col-span-2">
										<Label htmlFor={`shipping-${index}-estimated-days`}>Prazo de reserva (dias)</Label>
										<Input
											id={`shipping-${index}-estimated-days`}
											type="number"
											value={provider.estimatedDays}
											onChange={(event) => updateProvider(index, { estimatedDays: event.target.value })}
											placeholder="3"
											className="max-w-[7rem]"
										/>
									</div>
									<div className="grid gap-2 md:col-span-4 xl:col-span-3">
										<Label htmlFor={`shipping-${index}-fixed-amount`}>Valor fixo do frete</Label>
										<Input
											id={`shipping-${index}-fixed-amount`}
											type="number"
											value={provider.fixedAmount}
											onChange={(event) => updateProvider(index, { fixedAmount: event.target.value })}
											placeholder="2500"
											disabled={provider.mode === "http"}
											className="max-w-[10rem]"
										/>
										<p className="text-xs text-muted-foreground">Use centavos, como 2500 para 25,00.</p>
									</div>
								</div>

								<div className="grid gap-4 md:grid-cols-12">
									<div className="grid gap-2 md:col-span-5 xl:col-span-4">
										<Label htmlFor={`shipping-${index}-countries`}>Países atendidos</Label>
										<Input
											id={`shipping-${index}-countries`}
											value={provider.supportedCountries}
											onChange={(event) => updateProvider(index, { supportedCountries: event.target.value })}
											onBlur={(event) =>
												formatProviderField(index, {
													supportedCountries: formatSupportedCountries(event.target.value),
												})
											}
											placeholder="BR, US, CA"
											className="max-w-[14rem]"
											autoCapitalize="characters"
											autoCorrect="off"
											spellCheck={false}
										/>
									</div>
									<div className="flex items-center gap-3 pt-8 md:col-span-5 xl:col-span-4">
										<Checkbox
											id={`shipping-${index}-postal`}
											checked={provider.requiresPostalCode}
											onCheckedChange={(checked) =>
												updateProvider(index, { requiresPostalCode: checked === true })
											}
										/>
										<Label htmlFor={`shipping-${index}-postal`}>Exige CEP</Label>
									</div>
								</div>

								<div className="space-y-3 rounded-lg border p-4">
									<p className="text-sm font-medium">Medidas padrão do pacote de reserva</p>
									<div className="grid gap-4 md:grid-cols-12">
										<div className="grid gap-2 md:col-span-3 xl:col-span-2">
											<Label htmlFor={`shipping-${index}-weight`}>Peso (g)</Label>
											<Input
												id={`shipping-${index}-weight`}
												type="number"
												value={provider.defaultWeightGrams}
												onChange={(event) =>
													updateProvider(index, { defaultWeightGrams: event.target.value })
												}
												className="max-w-[8rem]"
											/>
										</div>
										<div className="grid gap-2 md:col-span-3 xl:col-span-2">
											<Label htmlFor={`shipping-${index}-length`}>Comprimento (cm)</Label>
											<Input
												id={`shipping-${index}-length`}
												type="number"
												value={provider.defaultLengthCm}
												onChange={(event) => updateProvider(index, { defaultLengthCm: event.target.value })}
												className="max-w-[8rem]"
											/>
										</div>
										<div className="grid gap-2 md:col-span-3 xl:col-span-2">
											<Label htmlFor={`shipping-${index}-width`}>Largura (cm)</Label>
											<Input
												id={`shipping-${index}-width`}
												type="number"
												value={provider.defaultWidthCm}
												onChange={(event) => updateProvider(index, { defaultWidthCm: event.target.value })}
												className="max-w-[8rem]"
											/>
										</div>
										<div className="grid gap-2 md:col-span-3 xl:col-span-2">
											<Label htmlFor={`shipping-${index}-height`}>Altura (cm)</Label>
											<Input
												id={`shipping-${index}-height`}
												type="number"
												value={provider.defaultHeightCm}
												onChange={(event) => updateProvider(index, { defaultHeightCm: event.target.value })}
												className="max-w-[8rem]"
											/>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
			<div className="flex flex-wrap gap-3">
				<Button type="button" variant="outline" onClick={addProvider} disabled={saving || loading}>
					Adicionar provedor
				</Button>
				<Button type="button" onClick={save} disabled={saving || loading}>
					{saving ? "Salvando..." : "Salvar frete"}
				</Button>
			</div>
			{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
		</div>
	);
}
