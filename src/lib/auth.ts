"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateAndCreateSession } from "@/lib/auth-login";
import { isBackofficeRole } from "@/lib/authz";
import { revokeSessionByJwt } from "@/lib/session";

// Async wrappers to avoid non-async exports in a "use server" file
export async function auth() {
	const mod = await import("@/lib/session");
	return mod.auth();
}
export async function decrypt(token: string) {
	const mod = await import("@/lib/session");
	return mod.decrypt(token);
}
export async function updateSession(request: Request) {
	const mod = await import("@/lib/session");
	// Loose typing for compatibility; middleware uses NextRequest.
	// @ts-ignore
	return mod.updateSession(request);
}

// Login Server Action authenticates against FastAPI
export async function login(_state: unknown, formData: FormData): Promise<{ error?: string } | undefined> {
	"use server";
	const emailRaw = formData.get("email");
	const passwordRaw = formData.get("password");
	if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
		return { error: "Dados inválidos" };
	}
	const email = emailRaw.toLowerCase();
	const password = passwordRaw;
	try {
		const result = await authenticateAndCreateSession({
			email,
			password,
			cartRaw: typeof formData.get("cart") === "string" ? String(formData.get("cart")) : null,
		});
		if (!result.ok) return { error: result.error };
		redirect(isBackofficeRole(result.role) ? "/admin" : "/");
	} catch (err: unknown) {
		if (
			err &&
			typeof err === "object" &&
			"digest" in err &&
			typeof (err as { digest?: unknown }).digest === "string" &&
			String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")
		) {
			throw err;
		}
		console.error("[login action]", err);
		return { error: "Erro de autenticação" };
	}
}

export async function logout() {
	"use server";
	const ck = (await cookies()).get("session")?.value;
	if (ck) await revokeSessionByJwt(ck);
	(await cookies()).delete("session");
	redirect("/login");
}
