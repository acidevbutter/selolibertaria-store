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
	const [status, setStatus] = useState<string | null>(null);
	const [passwordValue, setPasswordValue] = useState("");
	const [confirmValue, setConfirmValue] = useState("");
	const [validating, setValidating] = useState(true);
	const [tokenValid, setTokenValid] = useState<boolean | null>(null);
	const router = useRouter();

	const strength = useMemo(() => {
		const pw = passwordValue;
		return {
			length: pw.length >= 10,
			upper: /[A-Z]/.test(pw),
			lower: /[a-z]/.test(pw),
			digit: /[0-9]/.test(pw),
			special: /[^A-Za-z0-9]/.test(pw),
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
				if (mounted) {
					setTokenValid(!!data?.valid);
					if (!data?.valid) setStatus(t("errors.invalidOrExpired"));
					setValidating(false);
				}
			} catch (err) {
				if (mounted) {
					setTokenValid(false);
					setStatus(t("errors.validate"));
					setValidating(false);
				}
			}
		}
		validate();
		return () => {
			mounted = false;
		};
	}, [token]);

	return (
		<div className="max-w-md mx-auto p-6">
			<h2 className="mb-4 text-xl font-semibold">{t("title")}</h2>
			{validating ? (
				<p className="text-sm text-muted-foreground">{t("status.validating")}</p>
			) : tokenValid === false ? (
				<div>
					<p className="text-sm text-red-500">{status || t("errors.invalidOrExpired")}</p>
					<div className="mt-3">
						<Button variant="secondary" onClick={() => router.push("/login")}>
							{t("actions.backToLogin")}
						</Button>
					</div>
				</div>
			) : (
				<form
					onSubmit={async (e) => {
						e.preventDefault();
						setStatus(null);
						if (!isStrong) return setStatus(t("errors.passwordWeak"));
						if (passwordValue !== confirmValue) return setStatus(t("errors.passwordMismatch"));
						try {
							const res = await fetch("/api/auth/reset-password", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ token, password: passwordValue }),
							});
							if (res.ok) {
								// Immediately navigate to login and show flash
								router.push("/login?reset=1");
								return;
							} else {
								setStatus(t("errors.submit"));
							}
						} catch (err) {
							setStatus(t("errors.unexpected"));
						}
					}}
				>
					<div className="grid gap-2">
						<Label htmlFor="password">{t("fields.password")}</Label>
						<Input
							name="password"
							type="password"
							value={passwordValue}
							onChange={(e) => setPasswordValue((e.target as HTMLInputElement).value)}
						/>
						<Label htmlFor="confirm">{t("fields.confirmPassword")}</Label>
						<Input
							name="confirm"
							type="password"
							value={confirmValue}
							onChange={(e) => setConfirmValue((e.target as HTMLInputElement).value)}
						/>
						<div className="text-sm text-muted-foreground">
							<div>{registerT("passwordStrength.title")}</div>
							<ul className="list-disc ml-5">
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
						<div className="flex gap-2 mt-2">
							<Button type="submit" disabled={!isStrong || passwordValue !== confirmValue}>
								{t("actions.submit")}
							</Button>
						</div>
						{status && <p className="text-sm mt-2">{status}</p>}
					</div>
				</form>
			)}
		</div>
	);
}
