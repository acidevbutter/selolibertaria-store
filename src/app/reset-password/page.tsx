"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/i18n/client";

export default function ResetPasswordPage() {
	const registerT = useTranslations("Register");
	const t = useTranslations("ResetPassword");
	const search = useSearchParams();
	const token = search.get("token") || "";
	// No caller passes `next` today (the emailed reset link only ever carries
	// `token`), and a person resetting a forgotten password has no session yet
	// — bouncing them to an auth-gated page as the default drops them back on
	// /login with no confirmation that anything happened.
	const next = search.get("next") || "/login?reset=1";
	const [status, setStatus] = useState<string | null>(null);
	const [passwordValue, setPasswordValue] = useState("");
	const [confirmValue, setConfirmValue] = useState("");
	const [validating, setValidating] = useState(true);
	const [tokenValid, setTokenValid] = useState<boolean | null>(null);
	const router = useRouter();

	const strength = useMemo(() => {
		const password = passwordValue;
		return {
			length: password.length >= 10,
			upper: /[A-Z]/.test(password),
			lower: /[a-z]/.test(password),
			digit: /[0-9]/.test(password),
			special: /[^A-Za-z0-9]/.test(password),
		};
	}, [passwordValue]);

	const isStrong = strength.length && strength.upper && strength.lower && strength.digit && strength.special;

	useEffect(() => {
		let mounted = true;

		async function validate() {
			if (!token) {
				if (mounted) {
					setTokenValid(false);
					setValidating(false);
				}
				return;
			}

			try {
				const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
				const data = (await res.json()) as { valid?: boolean; error?: string };
				if (!mounted) return;
				setTokenValid(Boolean(data?.valid));
				if (!data?.valid) setStatus(t("errors.invalidOrExpired"));
				setValidating(false);
			} catch {
				if (!mounted) return;
				setTokenValid(false);
				setStatus(t("errors.validate"));
				setValidating(false);
			}
		}

		void validate();
		return () => {
			mounted = false;
		};
	}, [token, t]);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		if (!isStrong) {
			setStatus(t("errors.passwordWeak"));
			return;
		}
		if (passwordValue !== confirmValue) {
			setStatus(t("errors.passwordMismatch"));
			return;
		}

		setStatus(null);

		try {
			const res = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password: passwordValue }),
			});
			const data = (await res.json()) as { ok?: boolean; error?: string };
			if (!res.ok || !data.ok) {
				setStatus(data.error || t("errors.submit"));
				return;
			}
			router.replace(next);
		} catch {
			setStatus(t("errors.unexpected"));
		}
	}

	if (validating) {
		return (
			<div className="mx-auto max-w-md px-4 py-10">
				<h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
				<p>{t("status.validating")}</p>
			</div>
		);
	}

	if (!tokenValid) {
		return (
			<div className="mx-auto max-w-md px-4 py-10">
				<h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
				<p className="mb-4">{status || t("errors.invalidOrExpired")}</p>
				<Button variant="outline" onClick={() => router.push("/login")}>
					{t("actions.backToLogin")}
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-md px-4 py-10">
			<h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<Label htmlFor="password">{t("fields.password")}</Label>
					<Input
						name="password"
						type="password"
						value={passwordValue}
						onChange={(event) => setPasswordValue(event.target.value)}
					/>
				</div>
				<div>
					<Label htmlFor="confirm">{t("fields.confirmPassword")}</Label>
					<Input
						name="confirm"
						type="password"
						value={confirmValue}
						onChange={(event) => setConfirmValue(event.target.value)}
					/>
				</div>
				<div className="text-sm text-muted-foreground">
					<div>{registerT("passwordStrength.title")}</div>
					<ul className="ml-5 list-disc">
						<li className={strength.length ? "text-green-500" : "text-red-500"}>
							{registerT("passwordStrength.rules.length")}
						</li>
						<li className={strength.upper ? "text-green-500" : "text-red-500"}>
							{registerT("passwordStrength.rules.upper")}
						</li>
						<li className={strength.lower ? "text-green-500" : "text-red-500"}>
							{registerT("passwordStrength.rules.lower")}
						</li>
						<li className={strength.digit ? "text-green-500" : "text-red-500"}>
							{registerT("passwordStrength.rules.digit")}
						</li>
						<li className={strength.special ? "text-green-500" : "text-red-500"}>
							{registerT("passwordStrength.rules.special")}
						</li>
					</ul>
				</div>
				<div className="mt-2 flex gap-2">
					<Button type="submit" disabled={!isStrong || passwordValue !== confirmValue}>
						{t("actions.submit")}
					</Button>
				</div>
				{status ? <p className="mt-2 text-sm">{status}</p> : null}
			</form>
		</div>
	);
}
