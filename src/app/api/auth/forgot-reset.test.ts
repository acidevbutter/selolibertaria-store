import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { issuePasswordResetToken } from "@/lib/account-access";

const describeIntegration = process.env.RUN_INTEGRATION_TESTS === "true" ? describe : describe.skip;

describeIntegration("forgot/reset integration", () => {
	it("creates hashed token and resets password", async () => {
		const [{ POST: forgotPOST }, { POST: resetPOST }, { getDb }] = await Promise.all([
			import("@/app/api/auth/forgot-password/route"),
			import("@/app/api/auth/reset-password/route"),
			import("@/lib/mongodb"),
		]);
		const db = await getDb();
		const users = db.collection("users");
		const email = `test+forgot-${Date.now()}@example.com`;
		const insert = await users.insertOne({ email, name: "Test User", passwordHash: "OLD_HASH" });
		const id = insert.insertedId;

		try {
			const forgotRequest = new Request("http://localhost/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			const forgotResponse = await forgotPOST(forgotRequest as Request);
			expect(forgotResponse.status).toBe(200);

			const userAfterForgot = await users.findOne<{
				passwordReset?: { tokenHash?: string; expiresAt?: Date | string; token?: string };
			}>({ _id: id });
			expect(userAfterForgot?.passwordReset?.tokenHash).toBeTruthy();
			expect(userAfterForgot?.passwordReset?.token).toBeUndefined();
			expect(userAfterForgot?.passwordReset?.expiresAt).toBeTruthy();

			const { token } = await issuePasswordResetToken({
				userId: id.toHexString(),
				purpose: "reset",
			});

			const newPassword = "Str0ng!Passw0rd";
			const resetRequest = new Request("http://localhost/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password: newPassword }),
			});
			const resetResponse = await resetPOST(resetRequest as Request);
			expect(resetResponse.status).toBe(200);

			const userAfterReset = await users.findOne<{ passwordHash?: string; passwordReset?: unknown }>({
				_id: id,
			});
			expect(userAfterReset?.passwordReset).toBeUndefined();
			expect(userAfterReset?.passwordHash).toBeTruthy();
			expect(await bcrypt.compare(newPassword, userAfterReset!.passwordHash!)).toBe(true);
		} finally {
			await users.deleteOne({ _id: id });
		}
	});
});
