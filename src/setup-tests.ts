import "next";
import { loadEnvConfig } from "@next/env";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

loadEnvConfig(".");
process.env.NEXT_PUBLIC_URL ??= "http://localhost:3000";
process.env.CATALOG_CURRENCY ??= "BRL";
process.env.FASTAPI_INTERNAL_API_KEY ??= "test-internal-key";
process.env.JWT_SECRET ??= "dev_super_secret_change_me_please_123456";

expect.extend(matchers);

afterEach(() => {
	cleanup();
});
