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

		NEXT_PUBLIC_DD_RUM_APPLICATION_ID: z.string().optional(),
		NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN: z.string().optional(),
		NEXT_PUBLIC_DD_SITE: z.string().optional(),
		NEXT_PUBLIC_DD_ENV: z.string().optional(),
		NEXT_PUBLIC_DD_SERVICE: z.string().optional(),
		NEXT_PUBLIC_DD_VERSION: z.string().optional(),
		NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE: z.string().optional(),
		NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE: z.string().optional(),
		NEXT_PUBLIC_DD_DEFAULT_PRIVACY_LEVEL: z.string().optional(),
	},
	runtimeEnv: {
		CATALOG_CURRENCY: process.env.CATALOG_CURRENCY,
		FASTAPI_API_URL: process.env.FASTAPI_API_URL,
		FASTAPI_INTERNAL_API_KEY: process.env.FASTAPI_INTERNAL_API_KEY,

		NEXT_PUBLIC_ASAAS_ENV: process.env.NEXT_PUBLIC_ASAAS_ENV,
		NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
		NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,

		NEXT_PUBLIC_LANGUAGE: process.env.NEXT_PUBLIC_LANGUAGE,

		NEXT_PUBLIC_DD_RUM_APPLICATION_ID: process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID,
		NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN: process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN,
		NEXT_PUBLIC_DD_SITE: process.env.NEXT_PUBLIC_DD_SITE,
		NEXT_PUBLIC_DD_ENV: process.env.NEXT_PUBLIC_DD_ENV,
		NEXT_PUBLIC_DD_SERVICE: process.env.NEXT_PUBLIC_DD_SERVICE,
		NEXT_PUBLIC_DD_VERSION: process.env.NEXT_PUBLIC_DD_VERSION,
		NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE: process.env.NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE,
		NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE: process.env.NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE,
		NEXT_PUBLIC_DD_DEFAULT_PRIVACY_LEVEL: process.env.NEXT_PUBLIC_DD_DEFAULT_PRIVACY_LEVEL,

		OAUTH_STATE_SECRET: process.env.OAUTH_STATE_SECRET,
	},
});

const vercelHost =
	process.env.VERCEL_ENV === "production"
		? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
		: process.env.VERCEL_URL;
const vercelUrl = vercelHost ? `https://${vercelHost}` : undefined;
const publicUrl = process.env.NEXT_PUBLIC_URL || vercelUrl;

if (!publicUrl) {
	throw new Error("Missing NEXT_PUBLIC_URL or NEXT_PUBLIC_VERCEL_URL variables!");
}

const _publicUrl = publicUrl;
export { _publicUrl as publicUrl };
