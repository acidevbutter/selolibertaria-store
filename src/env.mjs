// @ts-check

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		CATALOG_CURRENCY: z.string().optional().default("BRL"),
		FASTAPI_API_URL: z.string().url().default("http://localhost:8000"),
		FASTAPI_INTERNAL_API_KEY: z.string().min(1),

		OAUTH_STATE_SECRET: z.string().min(32),
	},
	client: {
		NEXT_PUBLIC_ASAAS_ENV: z.enum(["sandbox", "production"]).optional().default("sandbox"),
		NEXT_PUBLIC_URL: z.string().url().optional(),

		NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),

		NEXT_PUBLIC_LANGUAGE: z.string().optional().default("pt-BR"),
	},
	runtimeEnv: {
		CATALOG_CURRENCY: process.env.CATALOG_CURRENCY,
		FASTAPI_API_URL: process.env.FASTAPI_API_URL,
		FASTAPI_INTERNAL_API_KEY: process.env.FASTAPI_INTERNAL_API_KEY,

		NEXT_PUBLIC_ASAAS_ENV: process.env.NEXT_PUBLIC_ASAAS_ENV,
		NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
		NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,

		NEXT_PUBLIC_LANGUAGE: process.env.NEXT_PUBLIC_LANGUAGE,

		OAUTH_STATE_SECRET: process.env.OAUTH_STATE_SECRET,
	},
});

const publicUrl = process.env.NEXT_PUBLIC_URL;

if (!publicUrl) {
	throw new Error("Missing NEXT_PUBLIC_URL variable!");
}

const _publicUrl = publicUrl;
export { _publicUrl as publicUrl };
