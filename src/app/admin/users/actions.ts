"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/env.mjs";
import { requireCapability } from "@/lib/api-auth";
import { normalizeUserRole } from "@/lib/authz";
import { revokeAllUserSessions } from "@/lib/session";

function parseUserId(formData: FormData) {
	const userId = String(formData.get("userId") ?? "").trim();
	if (!/^[0-9a-f-]{36}$/.test(userId)) {
		throw new Error("ID de usuário inválido.");
	}
	return userId;
}

async function requireStaffManager() {
	const auth = await requireCapability("staff.manage");
	if ("error" in auth) redirect("/forbidden");
	return auth.session;
}

async function refreshAdminUserViews(userId: string) {
	revalidatePath("/admin/users");
	revalidatePath(`/admin/users/${userId}`);
}

async function fastApiRequest(userId: string, path: string, body: Record<string, unknown>) {
	const token = (await cookies()).get("session")?.value;
	if (!token) redirect("/login");
	const response = await fetch(`${env.FASTAPI_API_URL}/users/${encodeURIComponent(userId)}${path}`, {
		method: "PATCH",
		headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
		body: JSON.stringify(body),
		cache: "no-store",
	});
	if (response.ok) return;
	const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
	throw new Error(payload?.detail || "Não foi possível atualizar o usuário.");
}

export async function updateUserRoleAction(formData: FormData) {
	const session = await requireStaffManager();
	const userId = parseUserId(formData);
	const nextRole = normalizeUserRole(String(formData.get("role") ?? "").trim() || "customer");

	if (userId === String(session.sub)) {
		throw new Error("Você não pode alterar o próprio papel.");
	}

	await fastApiRequest(userId, "/role", { role: nextRole });
	await revokeAllUserSessions(userId);
	await refreshAdminUserViews(userId);
}

export async function setUserBlockedAction(formData: FormData) {
	const session = await requireStaffManager();
	const userId = parseUserId(formData);
	const shouldBlock = String(formData.get("blocked") ?? "false").trim() === "true";
	const reason = String(formData.get("reason") ?? "").trim() || null;

	if (userId === String(session.sub) && shouldBlock) {
		throw new Error("Você não pode bloquear a própria conta.");
	}

	await fastApiRequest(userId, "/block", {
		blocked: shouldBlock,
		blocked_by: String(session.sub),
		blocked_reason: reason,
	});
	await revokeAllUserSessions(userId);
	await refreshAdminUserViews(userId);
}
