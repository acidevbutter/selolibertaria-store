import process from "node:process";
import nextEnv from "@next/env";
import { MongoClient } from "mongodb";
import type { EditorialDocument } from "../src/lib/editorial-content";
import { buildSeedEditorialDocuments } from "../src/lib/editorial-content-seed";

const { loadEnvConfig } = nextEnv;
const MIGRATION_ID = "2026-06-27-p3-75b-editorial-copy";
const EDITORIAL_COLLECTION = "editorialContent";
const MIGRATIONS_COLLECTION = "editorialMigrations";

loadEnvConfig(process.cwd());

function getRequiredEnv(name: string) {
	const value = process.env[name]?.trim();

	if (!value) {
		throw new Error(`Variável obrigatória ausente: ${name}`);
	}

	return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

function collectMissingPaths(
	seedValue: unknown,
	currentValue: unknown,
	path = "",
): Array<{ path: string; value: unknown }> {
	if (seedValue === undefined) {
		return [];
	}

	if (path && currentValue === undefined) {
		return [{ path, value: seedValue }];
	}

	if (Array.isArray(seedValue)) {
		return [];
	}

	if (isPlainObject(seedValue)) {
		if (currentValue === undefined) {
			return path ? [{ path, value: seedValue }] : [];
		}

		if (!isPlainObject(currentValue)) {
			return [];
		}

		return Object.entries(seedValue).flatMap(([key, value]) =>
			collectMissingPaths(value, currentValue[key], path ? `${path}.${key}` : key),
		);
	}

	return [];
}

async function run() {
	const mongoUri = getRequiredEnv("MONGODB_URI");
	const dbName = getRequiredEnv("MONGODB_DB_NAME");
	const force = process.argv.includes("--force");
	const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });

	try {
		await client.connect();
		const db = client.db(dbName);
		const editorialCollection = db.collection<EditorialDocument>(EDITORIAL_COLLECTION);
		const migrationsCollection = db.collection(MIGRATIONS_COLLECTION);
		const docs = buildSeedEditorialDocuments();
		const now = new Date().toISOString();

		let createdCount = 0;
		let patchedCount = 0;
		let skippedCount = 0;
		const createdDocs: string[] = [];
		const patchedPathsLog: string[] = [];
		const skippedDocs: string[] = [];

		for (const doc of docs) {
			const key = `${doc.type}/${doc.slug}`;
			const existing = await editorialCollection.findOne({ type: doc.type, slug: doc.slug });
			const { _id: _seedId, ...seedDoc } = doc as EditorialDocument & { _id?: unknown };

			if (!existing) {
				await editorialCollection.insertOne({
					...seedDoc,
					createdAt: doc.createdAt ?? now,
					updatedAt: now,
					updatedBy: "system:migration",
				});

				createdCount += 1;
				createdDocs.push(key);
				console.log(`[editorial-migration] created: ${key}`);
				continue;
			}

			if (force) {
				await editorialCollection.updateOne(
					{ type: doc.type, slug: doc.slug },
					{
						$set: {
							...seedDoc,
							updatedAt: now,
							updatedBy: "system:migration:force",
							createdAt: existing.createdAt ?? doc.createdAt ?? now,
							createdBy: existing.createdBy ?? doc.createdBy ?? "system:migration",
						},
					},
				);

				patchedCount += 1;
				patchedPathsLog.push(`${key} :: force`);
				console.log(`[editorial-migration] force-updated: ${key}`);
				continue;
			}

			const missingPaths = collectMissingPaths(doc, existing).filter(
				(entry) =>
					![
						"_id",
						"createdAt",
						"createdBy",
						"updatedAt",
						"updatedBy",
						"published",
						"order",
						"type",
						"slug",
						"title",
						"summary",
					].includes(entry.path),
			);

			if (missingPaths.length === 0) {
				skippedCount += 1;
				skippedDocs.push(key);
				console.log(`[editorial-migration] skipped: ${key}`);
				continue;
			}

			const patch = Object.fromEntries(missingPaths.map((entry) => [entry.path, entry.value]));

			await editorialCollection.updateOne(
				{ type: doc.type, slug: doc.slug },
				{
					$set: {
						...patch,
						updatedAt: now,
						updatedBy: "system:migration",
					},
				},
			);

			patchedCount += 1;
			for (const entry of missingPaths) {
				patchedPathsLog.push(`${key} :: ${entry.path}`);
				console.log(`[editorial-migration] patched: ${key} -> ${entry.path}`);
			}
		}

		await migrationsCollection.updateOne(
			{ id: MIGRATION_ID },
			{
				$set: {
					id: MIGRATION_ID,
					version: "p3.75b",
					status: "completed",
					force,
					appliedAt: now,
					updatedAt: now,
					stats: {
						createdCount,
						patchedCount,
						skippedCount,
					},
					createdDocs,
					patchedPathsLog,
					skippedDocs,
				},
				$setOnInsert: {
					createdAt: now,
				},
			},
			{ upsert: true },
		);

		console.log(
			`[editorial-migration] complete: created=${createdCount} patched=${patchedCount} skipped=${skippedCount}`,
		);
	} finally {
		await client.close();
	}
}

run().catch((error) => {
	console.error("[editorial-migration] failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
