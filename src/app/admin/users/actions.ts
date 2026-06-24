"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/api-auth";
import { normalizeUserRole, type UserRole } from "@/lib/authz";
import { getDb } from "@/lib/mongodb";
import { revokeAllUserSessions } from "@/lib/session";

function parseUserId(formData: FormData) {
	const userId = String(formData.get("userId") ?? "").trim();
	if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
		throw new Error("ID de usuário inválido.");
	}
	return userId;
}

async function requireStaffManager() {
	const auth = await requireCapability("staff.manage");
	if ("error" in auth) redirect("/forbidden");
	return auth.session;
}

async function countActiveAdmins() {
	const db = await getDb();
	return await db.collection("users").countDocuments({
		role: "admin",
		$or: [
			{ access: { $exists: false } },
			{ "access.blockedAt": null },
			{ "access.blockedAt": { $exists: false } },
		],
	});
}

async function refreshAdminUserViews(userId: string) {
	revalidatePath("/admin/users");
	revalidatePath(`/admin/users/${userId}`);
}

export async function updateUserRoleAction(formData: FormData) {
	const session = await requireStaffManager();
	const userId = parseUserId(formData);
	const nextRole = normalizeUserRole(String(formData.get("role") ?? "").trim() || "customer");

	if (userId === String(session.sub)) {
		throw new Error("Você não pode alterar o próprio papel.");
	}

	const db = await getDb();
	const users = db.collection("users");
	const existing = await users.findOne<{ _id: ObjectId; role?: UserRole }>({ _id: new ObjectId(userId) });
	if (!existing) {
		throw new Error("Usuário não encontrado.");
	}

	if (normalizeUserRole(existing.role) === "admin" && nextRole !== "admin") {
		const adminCount = await countActiveAdmins();
		if (adminCount <= 1) {
			throw new Error("Pelo menos um administrador ativo deve permanecer.");
		}
	}

	await users.updateOne(
		{ _id: existing._id },
		{
			$set: {
				role: nextRole,
				updatedAt: new Date(),
			},
		},
	);

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

	const db = await getDb();
	const users = db.collection("users");
	const existing = await users.findOne<{ _id: ObjectId; role?: UserRole }>({ _id: new ObjectId(userId) });
	if (!existing) {
		throw new Error("Usuário não encontrado.");
	}

	if (normalizeUserRole(existing.role) === "admin" && shouldBlock) {
		const adminCount = await countActiveAdmins();
		if (adminCount <= 1) {
			throw new Error("Pelo menos um administrador ativo deve permanecer.");
		}
	}

	await users.updateOne(
		{ _id: existing._id },
		shouldBlock
			? {
					$set: {
						"access.blockedAt": new Date(),
						"access.blockedBy": String(session.sub),
						"access.blockedReason": reason,
						updatedAt: new Date(),
					},
				}
			: {
					$set: {
						"access.blockedAt": null,
						"access.blockedBy": String(session.sub),
						"access.blockedReason": reason,
						updatedAt: new Date(),
					},
				},
	);

	await revokeAllUserSessions(userId);
	await refreshAdminUserViews(userId);
}
