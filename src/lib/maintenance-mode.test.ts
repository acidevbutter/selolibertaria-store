// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

// `isMaintenanceModeEnabled` wraps its FastAPI read in React's `cache()`,
// which memoizes per module instance outside of an actual render — so each
// test gets a fresh module (and a fresh cache) via resetModules + a dynamic
// import, instead of importing once at the top of the file.
async function loadWithFetch(fetchImpl: typeof fetch) {
	vi.resetModules();
	vi.stubGlobal("fetch", fetchImpl);
	const mod = await import("@/lib/maintenance-mode");
	return mod.isMaintenanceModeEnabled;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("isMaintenanceModeEnabled", () => {
	it("is off when the backend reports the site as activated", async () => {
		const isMaintenanceModeEnabled = await loadWithFetch(
			vi.fn(async () => Response.json({ activated: true })),
		);
		expect(await isMaintenanceModeEnabled()).toBe(false);
	});

	it("is on when the backend reports the site as not activated", async () => {
		const isMaintenanceModeEnabled = await loadWithFetch(
			vi.fn(async () => Response.json({ activated: false })),
		);
		expect(await isMaintenanceModeEnabled()).toBe(true);
	});

	it("fails closed (on) when the backend responds with a non-200 status", async () => {
		const isMaintenanceModeEnabled = await loadWithFetch(
			vi.fn(async () => new Response(null, { status: 500 })),
		);
		expect(await isMaintenanceModeEnabled()).toBe(true);
	});

	it("fails closed (on) when the fetch throws", async () => {
		const isMaintenanceModeEnabled = await loadWithFetch(
			vi.fn(async () => {
				throw new Error("network error");
			}),
		);
		expect(await isMaintenanceModeEnabled()).toBe(true);
	});
});
