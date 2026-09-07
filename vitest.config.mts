import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

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
	},
});
