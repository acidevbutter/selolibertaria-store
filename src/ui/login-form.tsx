"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/cart-context";
import { useTranslations } from "@/i18n/client";
import type { SupportedCurrency } from "@/lib/currency";
import type { OAuthProviderId } from "@/lib/oauth/catalog";
import { cn } from "@/lib/utils";
import { OAuthButtons } from "@/ui/auth/oauth-buttons";
import { OAuthCompletionForm } from "@/ui/auth/oauth-completion-form.client";
import { RegisterForm } from "@/ui/auth/register-form.client";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { PasswordInput } from "@/ui/shadcn/password-input";

type ProviderLink = {
	id: OAuthProviderId;
	label: string;
	href: string;
};

const fieldClassName =
	"h-12 rounded-none border-[color:var(--editorial-border)] bg-transparent px-4 text-base text-[color:var(--editorial-ink)] shadow-none placeholder:text-[color:var(--editorial-muted)] focus-visible:ring-0 focus-visible:border-[color:var(--editorial-ink)]";

export function LoginForm({
	className,
	defaultCountry = "BR",
	defaultCurrency = "USD",
	providers = [],
	onModeChange,
	...props
}: React.ComponentPropsWithoutRef<"div"> & {
	defaultCountry?: string;
	defaultCurrency?: SupportedCurrency;
	providers?: ProviderLink[];
	onModeChange?: (mode: "login" | "register" | "pending") => void;
}) {
	const searchParams = useSearchParams();
	const loginFormRef = useRef<HTMLFormElement | null>(null);

	const [mode, setMode] = useState<"login" | "register" | "pending">("login");
	const [submitting, setSubmitting] = useState(false);
	const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
	const [recoveryMode, setRecoveryMode] = useState(false);
	const [forgotStatus, setForgotStatus] = useState<string | null>(null);
	const { cart } = useCart();
	const t = useTranslations("Login");
	const oauthComplete = searchParams.get("oauth_complete");
	const oauthError = searchParams.get("oauth_error");
	const loginError = searchParams.get("login_error");
	const providerLabel = providers.find((provider) => provider.id === oauthComplete)?.label ?? "Instagram";

	useEffect(() => {
		onModeChange?.(mode);
	}, [mode, onModeChange]);

	function persistLoginDraft() {
		if (typeof window === "undefined" || !loginFormRef.current) return;
		const formData = new FormData(loginFormRef.current);
		const email = String(formData.get("username") || "")
			.trim()
			.toLowerCase();
		const password = String(formData.get("password") || "");
		if (!email || !password) return;
		try {
			window.sessionStorage.setItem(
				"selolibertaria_login_draft",
				JSON.stringify({
					email,
					password,
					createdAt: Date.now(),
				}),
			);
		} catch {}
		setSubmitting(true);
	}

	return (
		<div className={cn("w-full", mode === "register" ? "max-w-5xl" : "max-w-[30rem]", className)} {...props}>
			{oauthError ? (
				<p className="mb-5 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{t("errors.socialLoginFailed")}
				</p>
			) : null}

			{oauthComplete ? (
				<div className="mb-6 border border-[color:var(--editorial-border)] bg-[color:rgba(216,208,196,0.32)] p-4">
					<OAuthCompletionForm providerLabel={providerLabel} />
				</div>
			) : null}

			{mode === "login" && !recoveryMode ? (
				<div className="space-y-6">
					<form
						ref={loginFormRef}
						action="/login/submit"
						method="post"
						autoComplete="on"
						onSubmit={persistLoginDraft}
					>
						{cart && cart.items.length > 0 ? (
							<input type="hidden" name="cart" value={JSON.stringify({ items: cart.items })} />
						) : null}

						<div className="grid gap-6">
							{loginError ? (
								<p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
									{loginError === "invalid"
										? t("errors.invalidCredentials")
										: loginError === "unverified"
											? t("errors.unverified")
											: t("errors.authentication")}
								</p>
							) : null}

							<div className="grid gap-2">
								<Label
									htmlFor="login-email"
									className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]"
								>
									{t("fields.email")}
								</Label>
								<Input
									id="login-email"
									name="username"
									type="text"
									placeholder={t("fields.emailPlaceholder")}
									autoComplete="username"
									inputMode="email"
									autoCapitalize="none"
									autoCorrect="off"
									spellCheck={false}
									required
									className={fieldClassName}
								/>
							</div>

							<div className="grid gap-2">
								<Label
									htmlFor="login-password"
									className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]"
								>
									{t("fields.password")}
								</Label>
								<PasswordInput
									id="login-password"
									name="password"
									autoComplete="current-password"
									required
									className={fieldClassName}
								/>
							</div>

							<Button
								type="submit"
								className="mt-2 h-12 w-full rounded-none bg-[color:var(--editorial-ink)] px-8 text-xs font-black uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-ink)]/92"
								disabled={submitting}
							>
								{submitting ? t("actions.signingIn") : t("actions.login")}
							</Button>
						</div>
					</form>

					<div className="text-left">
						<button
							type="button"
							className="text-sm underline underline-offset-4 text-[color:var(--editorial-accent)]"
							onClick={() => setRecoveryMode(true)}
						>
							{t("actions.forgotPassword")}
						</button>
					</div>

					<OAuthButtons providers={providers} />

					<div className="pt-3 text-sm text-[color:var(--editorial-muted)]">
						{mode === "login" ? (
							<button
								type="button"
								className="underline underline-offset-4 text-[color:var(--editorial-accent)]"
								onClick={() => setMode("register")}
							>
								{t("switch.noAccount")}
							</button>
						) : null}
					</div>
				</div>
			) : null}

			{mode === "login" && recoveryMode ? (
				<div className="space-y-5 border-t border-[color:var(--editorial-border)] pt-6">
					<form
						autoComplete="on"
						onSubmit={async (e) => {
							e.preventDefault();
							setForgotStatus(null);
							const form = new FormData(e.currentTarget as HTMLFormElement);
							const email = String(form.get("email") || "")
								.trim()
								.toLowerCase();
							if (!email) {
								setForgotStatus(t("recovery.enterEmail"));
								return;
							}
							try {
								const res = await fetch("/api/auth/forgot-password", {
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({ email }),
								});
								if (res.ok) setForgotStatus(t("recovery.sent"));
								else setForgotStatus(t("recovery.failed"));
							} catch {
								setForgotStatus(t("recovery.unexpected"));
							}
						}}
					>
						<div className="grid gap-5">
							<div className="grid gap-2">
								<Label
									htmlFor="forgot-email"
									className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]"
								>
									{t("fields.email")}
								</Label>
								<Input
									id="forgot-email"
									name="email"
									type="email"
									autoComplete="email"
									className={fieldClassName}
								/>
							</div>
							<div className="flex flex-wrap gap-3">
								<Button
									type="submit"
									className="h-12 rounded-none bg-[color:var(--editorial-ink)] px-6 text-xs font-black uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-ink)]/92"
								>
									{t("actions.sendRecoveryEmail")}
								</Button>
								<Button
									type="button"
									variant="ghost"
									className="h-12 rounded-none border border-[color:var(--editorial-border)] px-6 text-xs font-black uppercase tracking-[0.22em]"
									onClick={() => {
										setRecoveryMode(false);
										setForgotStatus(null);
									}}
								>
									{t("actions.backToLogin")}
								</Button>
							</div>
							{forgotStatus ? (
								<p className="text-sm text-[color:var(--editorial-muted)]">{forgotStatus}</p>
							) : null}
						</div>
					</form>
				</div>
			) : null}

			{mode === "register" ? (
				<div className="border border-[color:var(--editorial-border)] bg-[color:rgba(216,208,196,0.2)] p-4 md:p-6 lg:p-8">
					<RegisterForm
						cart={cart}
						defaultCountry={defaultCountry}
						defaultCurrency={defaultCurrency}
						pending={submitting}
						onRegistered={(email) => {
							setRegisteredEmail(email);
							setMode("pending");
						}}
					/>
					<div className="mt-5 text-sm text-[color:var(--editorial-muted)]">
						<button type="button" className="underline underline-offset-4" onClick={() => setMode("login")}>
							{t("switch.haveAccount")}
						</button>
					</div>
				</div>
			) : null}

			{mode === "pending" ? (
				<div className="space-y-4 border border-[color:var(--editorial-border)] bg-[color:rgba(216,208,196,0.2)] p-5">
					<h3 className="text-2xl font-black tracking-[-0.04em]">{t("pending.title")}</h3>
					<p className="text-base leading-7 text-[color:var(--editorial-muted)]">
						{t("pending.description")}
					</p>
					<p className="text-sm text-[color:var(--editorial-muted)]">
						{t("pending.sentTo", { email: registeredEmail ?? "" })}
					</p>
				</div>
			) : null}
		</div>
	);
}
