"use client";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/context/cart-context";
import { useTranslations } from "@/i18n/client";
import type { SupportedCurrency } from "@/lib/currency";
import type { OAuthProviderId } from "@/lib/oauth/catalog";
import { cn } from "@/lib/utils";
import { OAuthButtons } from "@/ui/auth/oauth-buttons";
import { OAuthCompletionForm } from "@/ui/auth/oauth-completion-form.client";
import { RegisterForm } from "@/ui/auth/register-form.client";
import { PasswordInput } from "@/ui/shadcn/password-input";

type ProviderLink = {
	id: OAuthProviderId;
	label: string;
	href: string;
};

export function LoginForm({
	className,
	defaultCountry = "BR",
	defaultCurrency = "USD",
	providers = [],
	...props
}: React.ComponentPropsWithoutRef<"div"> & {
	defaultCountry?: string;
	defaultCurrency?: SupportedCurrency;
	providers?: ProviderLink[];
}) {
	const searchParams = useSearchParams();
	const loginFormRef = useRef<HTMLFormElement | null>(null);

	const [mode, setMode] = useState<"login" | "register" | "pending">("login");
	const [submitting, setSubmitting] = useState(false);
	const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
	// showForgot was replaced by recoveryMode
	const [recoveryMode, setRecoveryMode] = useState(false);
	const [forgotStatus, setForgotStatus] = useState<string | null>(null);
	const { cart } = useCart();
	const t = useTranslations("Login");
	const oauthComplete = searchParams.get("oauth_complete");
	const oauthError = searchParams.get("oauth_error");
	const loginError = searchParams.get("login_error");
	const providerLabel = providers.find((provider) => provider.id === oauthComplete)?.label ?? "Instagram";

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
				"storefront_login_draft",
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
		<div
			className={cn(
				"flex flex-col gap-6",
				mode === "register" ? "mx-auto w-full max-w-5xl" : "mx-auto w-full max-w-md",
				className,
			)}
			{...props}
		>
			<Card className={cn(mode === "register" ? "border-border/70 shadow-lg" : "")}>
				<CardHeader>
					<CardTitle className="display-font text-3xl text-foreground">
						{mode === "login" ? t("card.loginTitle") : t("card.registerTitle")}
					</CardTitle>
					<CardDescription>
						{mode === "login" ? t("card.loginDescription") : t("card.registerDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent className={cn(mode === "register" ? "p-4 md:p-6 lg:p-8" : "")}>
					{oauthError ? (
						<p className="mb-4 text-sm rounded-md bg-destructive/10 text-destructive px-3 py-2 border border-destructive/30">
							{t("errors.socialLoginFailed")}
						</p>
					) : null}
					{oauthComplete ? (
						<div className="mb-6">
							<OAuthCompletionForm providerLabel={providerLabel} />
						</div>
					) : null}
					{mode === "login" && !recoveryMode && (
						<>
							<form
								ref={loginFormRef}
								action="/login/submit"
								method="post"
								autoComplete="on"
								onSubmit={persistLoginDraft}
							>
								{cart && cart.items.length > 0 && (
									<input type="hidden" name="cart" value={JSON.stringify({ items: cart.items })} />
								)}
								<div className="grid gap-6">
									{loginError ? (
										<p className="text-sm rounded-md bg-destructive/10 text-destructive px-3 py-2 border border-destructive/30">
											{loginError === "invalid" ? t("errors.invalidCredentials") : t("errors.authentication")}
										</p>
									) : null}
									<div className="grid gap-2">
										<Label htmlFor="login-email">{t("fields.email")}</Label>
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
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="login-password">{t("fields.password")}</Label>
										<PasswordInput
											id="login-password"
											name="password"
											autoComplete="current-password"
											required
										/>
									</div>
									<Button
										type="submit"
										className="mx-auto mt-1 flex h-11 w-full max-w-[22rem] rounded-xl px-8"
										disabled={submitting}
									>
										{submitting ? t("actions.signingIn") : t("actions.login")}
									</Button>
									<OAuthButtons providers={providers} />
								</div>
							</form>
							<div className="mt-2 text-right">
								<button type="button" className="underline text-sm" onClick={() => setRecoveryMode(true)}>
									{t("actions.forgotPassword")}
								</button>
							</div>
						</>
					)}

					{mode === "login" && recoveryMode && (
						<div>
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
									} catch (err) {
										setForgotStatus(t("recovery.unexpected"));
									}
								}}
							>
								<div className="grid gap-2">
									<Label htmlFor="forgot-email">{t("fields.email")}</Label>
									<Input id="forgot-email" name="email" type="email" autoComplete="email" />
									<div className="flex gap-2">
										<Button type="submit" className="flex-1">
											{t("actions.sendRecoveryEmail")}
										</Button>
										<Button
											type="button"
											variant="ghost"
											onClick={() => {
												setRecoveryMode(false);
												setForgotStatus(null);
											}}
										>
											{t("actions.backToLogin")}
										</Button>
									</div>
									{forgotStatus && <p className="text-sm mt-2">{forgotStatus}</p>}
								</div>
							</form>
						</div>
					)}
					{mode === "register" && (
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
					)}
					{mode === "pending" && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">{t("pending.title")}</h3>
							<p>{t("pending.description")}</p>
							<p className="text-sm text-muted-foreground">
								{t("pending.sentTo", { email: registeredEmail ?? "" })}
							</p>
						</div>
					)}
					{mode !== "pending" && (
						<div className="mt-4 text-center text-sm">
							{mode === "login" ? (
								<button type="button" className="underline" onClick={() => setMode("register")}>
									{t("switch.noAccount")}
								</button>
							) : (
								<button type="button" className="underline" onClick={() => setMode("login")}>
									{t("switch.haveAccount")}
								</button>
							)}
						</div>
					)}
				</CardContent>
			</Card>
			<div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
				{t("legal.prefix")} <a href="/terms">{t("legal.terms")}</a> {t("legal.and")}{" "}
				<a href="/privacy">{t("legal.privacy")}</a>.
			</div>
		</div>
	);
}
