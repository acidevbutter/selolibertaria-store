"use client";

import { useEffect } from "react";

type LoginDraft = {
	email: string;
	password: string;
	createdAt: number;
};

const LOGIN_DRAFT_KEY = "storefront_login_draft";
const LOGIN_DRAFT_MAX_AGE_MS = 5 * 60 * 1000;

export function CredentialSaveOnAuth() {
	useEffect(() => {
		if (typeof window === "undefined" || !("credentials" in navigator)) return;

		const PasswordCredentialCtor = (
			window as Window & {
				PasswordCredential?: new (data: { id: string; password: string; name?: string }) => Credential;
			}
		).PasswordCredential;
		if (!PasswordCredentialCtor) return;

		let cancelled = false;

		(async () => {
			let rawDraft: string | null = null;
			try {
				rawDraft = window.sessionStorage.getItem(LOGIN_DRAFT_KEY);
			} catch {
				return;
			}
			if (!rawDraft) return;

			let draft: LoginDraft | null = null;
			try {
				draft = JSON.parse(rawDraft) as LoginDraft;
			} catch {
				window.sessionStorage.removeItem(LOGIN_DRAFT_KEY);
				return;
			}

			if (
				!draft?.email ||
				!draft.password ||
				!draft.createdAt ||
				Date.now() - draft.createdAt > LOGIN_DRAFT_MAX_AGE_MS
			) {
				window.sessionStorage.removeItem(LOGIN_DRAFT_KEY);
				return;
			}

			try {
				const authRes = await fetch("/api/user", { cache: "no-store" });
				if (!authRes.ok || cancelled) return;
				const user = (await authRes.json()) as { email?: string; name?: string };
				if (!user.email || user.email.toLowerCase() !== draft.email.toLowerCase()) return;

				const credential = new PasswordCredentialCtor({
					id: draft.email,
					password: draft.password,
					name: user.name || undefined,
				});
				await navigator.credentials.store(credential);
				window.sessionStorage.removeItem(LOGIN_DRAFT_KEY);
			} catch {
				// Ignore browser credential storage failures; login already succeeded.
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	return null;
}
