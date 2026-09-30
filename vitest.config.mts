import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true,
		alias: {
			// `server-only` throws on import outside a React Server Component bundle.
			// Vitest doesn't use the `react-server` export condition, so stub it out
			// to let server modules be unit-tested directly.
			"server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
		},
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./src/setup-tests.ts"],
		// Playwright e2e specs (e2e/journeys/**/*.spec.ts) live outside src and
		// import "@playwright/test", not vitest — exclude them so `yarn test`
		// doesn't try to collect them alongside unit tests.
		exclude: [...configDefaults.exclude, "e2e/**"],
	},
});
