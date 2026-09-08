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

// Admin seed and editorial content migration used to run here, gated on
// VERCEL_ENV=production. Both scripts were removed in 6dc7ec5 as part of the
// Mongo -> Postgres cutover; their replacements live in the backend
// (backend/scripts/create_admin.py, backend/app/migrations) and run there
// instead, not at frontend build time.

console.log("[build] next build: running");
runCommand("next", ["build", "--webpack"]);
