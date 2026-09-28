import "next";
import { loadEnvConfig } from "@next/env";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

// Pre-warm React's jsx-dev-runtime shim while NODE_ENV is guaranteed to be
// its normal (non-production) value.
//
// `react/jsx-dev-runtime` picks its dev-vs-prod build once, at first
// `require()`, and caches that choice for the rest of the process. Vitest's
// per-test-file isolation only resets its own virtual module graph -- the
// underlying Node `require` cache used for externalized CJS deps like this
// one is shared for the life of the worker across every test file that
// worker runs (and, with `--sequence.shuffle`, that includes the order of
// tests *within* a single file too). So whichever test happens to be first,
// in a given worker, to import a JSX-containing module while `NODE_ENV` is
// stubbed to "production" (e.g. via `vi.stubEnv("NODE_ENV", "production")`)
// permanently locks that worker into the production (non-dev) jsx-runtime
// build, breaking every later dev-mode JSX render in that worker with
// "jsxDEV is not a function" (see selolibertaria-store#193).
//
// This setup file runs before any test body -- and therefore before any
// NODE_ENV stubbing -- for every test file, so importing the runtime here
// forces the dev build to win the race for the whole suite, regardless of
// file/test shuffle order.
import "react/jsx-dev-runtime";

loadEnvConfig(".");
process.env.NEXT_PUBLIC_URL ??= "http://localhost:3000";
process.env.CATALOG_CURRENCY ??= "BRL";
process.env.FASTAPI_INTERNAL_API_KEY ??= "test-internal-key";
process.env.OAUTH_STATE_SECRET ??= "dev_oauth_state_secret_change_me_please_123456";

expect.extend(matchers);

afterEach(() => {
	cleanup();
});
