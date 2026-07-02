import bcrypt from "bcryptjs";
import { z } from "zod";
import { resolvePasswordResetToken } from "@/lib/account-access";
import { getDb } from "@/lib/mongodb";

const schema = z.object({
	token: z.string().min(16),
	password: z.string().min(10),
});

function isStrongPassword(password: string) {
	const minLen = password.length >= 10;
	const upper = /[A-Z]/.test(password);
	const lower = /[a-z]/.test(password);
	const digit = /[0-9]/.test(password);
	const special = /[^A-Za-z0-9]/.test(password);
	return minLen && upper && lower && digit && special;
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { token, password } = schema.parse(body);

		if (!isStrongPassword(password)) {
			return new Response(JSON.stringify({ error: "A senha não atende aos requisitos de segurança" }), {
				status: 400,
			});
		}

		const resolved = await resolvePasswordResetToken(token);
		if (!resolved.ok) {
			return new Response(
				JSON.stringify({
					error: resolved.error === "expired" ? "Token expirado" : "Token inválido",
				}),
				{ status: 400 },
			);
		}

		const hashed = await bcrypt.hash(password, 10);
		const db = await getDb();
		const update = await db.collection("users").updateOne(
			{
				_id: resolved.user._id,
				"passwordReset.tokenHash": resolved.user.passwordReset?.tokenHash,
			},
			{
				$set: {
					passwordHash: hashed,
					updatedAt: new Date(),
				},
				$unset: { passwordReset: "" },
				$addToSet: { authMethods: "password" },
			},
		);

		if (update.modifiedCount !== 1) {
			return new Response(JSON.stringify({ error: "Token inválido ou já utilizado" }), {
				status: 400,
			});
		}

		return new Response(JSON.stringify({ ok: true }), { status: 200 });
	} catch (err) {
		console.error(err);
		return new Response(JSON.stringify({ error: "Requisição inválida" }), { status: 400 });
	}
}

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const token = url.searchParams.get("token");

		if (!token) {
			return new Response(JSON.stringify({ valid: false, error: "Token ausente" }), { status: 400 });
		}

		const resolved = await resolvePasswordResetToken(token);
		if (!resolved.ok) {
			return new Response(
				JSON.stringify({
					valid: false,
					error: resolved.error === "expired" ? "Token expirado" : "Token inválido",
				}),
				{ status: 200 },
			);
		}

		return new Response(JSON.stringify({ valid: true }), { status: 200 });
	} catch (err) {
		console.error(err);
		return new Response(JSON.stringify({ valid: false, error: "Erro no servidor" }), {
			status: 500,
		});
	}
}
