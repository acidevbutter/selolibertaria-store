import process from "node:process";
import nextEnv from "@next/env";
import { MongoClient } from "mongodb";
import { getMockEditorialDocuments } from "../src/lib/editorial-content-mock";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function getRequiredEnv(name: string) {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`Variável obrigatória ausente: ${name}`);
	}
	return value;
}

async function run() {
	const mongoUri = getRequiredEnv("MONGODB_URI");
	const dbName = getRequiredEnv("MONGODB_DB_NAME");
	const force = process.argv.includes("--force");
	const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });

	try {
		await client.connect();
		const db = client.db(dbName);
		const collection = db.collection("editorialContent");
		const now = new Date().toISOString();
		const docs = getMockEditorialDocuments();

		for (const doc of docs) {
			const existing = await collection.findOne({ type: doc.type, slug: doc.slug });
			if (existing && !force) {
				console.log(`[editorial-seed] skipped: ${doc.type}/${doc.slug}`);
				continue;
			}

			await collection.updateOne(
				{ type: doc.type, slug: doc.slug },
				{
					$set: {
						...doc,
						updatedAt: now,
						updatedBy: "system:migration",
						published: doc.published ?? true,
					},
					$setOnInsert: {
						createdAt: now,
					},
				},
				{ upsert: true },
			);

			console.log(`[editorial-seed] ${existing ? "updated" : "created"}: ${doc.type}/${doc.slug}`);
		}
	} finally {
		await client.close();
	}
}

run().catch((error) => {
	console.error("[editorial-seed] failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
