import { spawnSync } from "node:child_process";

function runCommand(command, args, options = {}) {
	const { continueOnError = false } = options;
	const result = spawnSync(command, args, {
		stdio: "inherit",
		env: process.env,
	});

	if (typeof result.status === "number" && result.status !== 0) {
		if (continueOnError) {
			console.error(`[build] command failed: ${command} ${args.join(" ")}`);
			return false;
		}

		process.exit(result.status);
	}

	if (result.error) {
		if (continueOnError) {
			console.error(`[build] command failed: ${command} ${args.join(" ")}`);
			console.error(result.error);
			return false;
		}

		throw result.error;
	}

	return true;
}

const isVercelProduction = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
const shouldRunAdminSeed = isVercelProduction;
const shouldRunEditorialMigrations = isVercelProduction && process.env.RUN_EDITORIAL_MIGRATIONS === "true";
const shouldRunImageMigration = isVercelProduction && process.env.RUN_PRODUCT_IMAGE_MIGRATION === "true";

if (shouldRunAdminSeed) {
	console.log("[build] admin seed: running");
	const seeded = runCommand("node", ["scripts/seed-admin.mjs"], {
		continueOnError: true,
	});

	if (!seeded) {
		console.log("[build] admin seed: failed, continuing build");
	}
} else {
	console.log("[build] admin seed: skipped");
}

if (shouldRunEditorialMigrations) {
	console.log("[build] editorial migrations: running");
	const migrated = runCommand("tsx", ["scripts/migrate-selo-editorial-content.ts"], {
		continueOnError: true,
	});

	if (!migrated) {
		console.log("[build] editorial migrations: failed, continuing build");
	}
} else {
	console.log("[build] editorial migrations: skipped");
}

if (shouldRunImageMigration) {
	console.log("[build] product image migration: running");
	const migrated = runCommand("node", ["scripts/migrate-stripe-product-images-to-cloudinary.mjs"], {
		continueOnError: true,
	});

	if (!migrated) {
		console.log("[build] product image migration: failed, continuing build");
	}
} else {
	console.log("[build] product image migration: skipped");
}

console.log("[build] next build: running");
runCommand("next", ["build", "--webpack"]);
