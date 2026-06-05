import process from "node:process";
import nextEnv from "@next/env";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function getRequiredEnv(name) {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`Variável obrigatória ausente: ${name}`);
	}
	return value;
}

function parseBoolean(value, defaultValue) {
	if (!value) return defaultValue;
	const normalized = value.trim().toLowerCase();
	if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
	throw new Error(`Valor booleano inválido para ADMIN_VERIFIED: ${value}`);
}

async function run() {
	const mongoUri = getRequiredEnv("MONGODB_URI");
	const dbName = getRequiredEnv("MONGODB_DB_NAME");
	const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });

	try {
		await client.connect();
		const db = client.db(dbName);
		const users = db.collection("users");
		await users.createIndex({ email: 1 }, { unique: true });

		const adminEmail = getRequiredEnv("ADMIN_EMAIL").toLowerCase();
		const adminPassword = getRequiredEnv("ADMIN_PASSWORD");
		const adminName = process.env.ADMIN_NAME?.trim() || "Administrador";
		const adminPhone = process.env.ADMIN_PHONE?.trim() || undefined;
		const adminVerified = parseBoolean(process.env.ADMIN_VERIFIED, true);
		const existingAdmin = await users.findOne({ role: "admin" }, { projection: { email: 1 } });

		if (adminPassword.length < 6) {
			throw new Error("ADMIN_PASSWORD deve ter pelo menos 6 caracteres.");
		}

		if (existingAdmin?.email && existingAdmin.email.toLowerCase() !== adminEmail) {
			console.log(
				`[admin-seed] skipped: existing admin ${existingAdmin.email} differs from requested ${adminEmail}`,
			);
			return;
		}

		const now = new Date();
		const passwordHash = await bcrypt.hash(adminPassword, 10);
		const fieldsToSet = {
			email: adminEmail,
			name: adminName,
			passwordHash,
			role: "admin",
			verified: adminVerified,
			updatedAt: now,
		};
		if (adminPhone) {
			fieldsToSet.phone = adminPhone;
		}
		const updateResult = await users.updateOne(
			{ email: adminEmail },
			{
				$set: fieldsToSet,
				$setOnInsert: {
					createdAt: now,
				},
				$unset: {
					verification: "",
				},
			},
			{ upsert: true },
		);

		if (updateResult.upsertedCount > 0) {
			console.log(`[admin-seed] created: ${adminEmail}`);
			return;
		}

		console.log(`[admin-seed] updated: ${adminEmail}`);
	} finally {
		await client.close();
	}
}

run().catch((error) => {
	console.error("[admin-seed] failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
