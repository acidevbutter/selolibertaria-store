import "next";
import { loadEnvConfig } from "@next/env";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

loadEnvConfig(".");
process.env.NEXT_PUBLIC_URL ??= "http://localhost:3000";
process.env.STRIPE_CURRENCY ??= "usd";
process.env.MONGODB_URI ??= "mongodb://localhost:27017";
process.env.MONGODB_DB_NAME ??= "selolibertaria";
process.env.JWT_SECRET ??= "dev_super_secret_change_me_please_123456";

expect.extend(matchers);

afterEach(() => {
	cleanup();
});
