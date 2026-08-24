// @ts-check

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		CATALOG_CURRENCY: z.string().optional().default("BRL"),
		FASTAPI_API_URL: z.string().url().default("http://localhost:8000"),
		FASTAPI_INTERNAL_API_KEY: z.string().min(1),
		MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
		MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),
		MERCADO_PAGO_RECONCILIATION_SECRET: z.string().optional(),
		CLOUDINARY_CLOUD_NAME: z.string().optional(),
		CLOUDINARY_API_KEY: z.string().optional(),
		CLOUDINARY_API_SECRET: z.string().optional(),
		CLOUDINARY_UPLOAD_FOLDER: z.string().optional(),

		MONGODB_URI: z
			.string()
			.min(1)
			.regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI must start with mongodb:// or mongodb+srv://"),
		MONGODB_DB_NAME: z.string(),
		JWT_SECRET: z.string().min(32),
		SMTP_HOST: z.string().optional(),
		SMTP_PORT: z
			.string()
			.optional()
			.transform((v) => (v ? Number(v) : undefined)),
		SMTP_USER: z.string().optional(),
		SMTP_PASS: z.string().optional(),
		SMTP_FROM: z.string().email().optional(),
		BREVO_API_KEY: z.string().optional(),
		BREVO_SENDER_EMAIL: z.string().email().optional(),
		BREVO_SENDER_NAME: z.string().optional(),
		MELHOR_ENVIO_ACCESS_TOKEN: z.string().optional(),
	},
	client: {
		NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY: z.string().optional(),
		NEXT_PUBLIC_URL: z.string().url().optional(),

		NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),

		NEXT_PUBLIC_NEWSLETTER_ENDPOINT: z.string().optional(),

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
		MERCADO_PAGO_ACCESS_TOKEN: process.env.MERCADO_PAGO_ACCESS_TOKEN,
		MERCADO_PAGO_WEBHOOK_SECRET: process.env.MERCADO_PAGO_WEBHOOK_SECRET,
		MERCADO_PAGO_RECONCILIATION_SECRET: process.env.MERCADO_PAGO_RECONCILIATION_SECRET,
		CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
		CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
		CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
		CLOUDINARY_UPLOAD_FOLDER: process.env.CLOUDINARY_UPLOAD_FOLDER,

		NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY,
		NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
		NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
		NEXT_PUBLIC_NEWSLETTER_ENDPOINT: process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT,

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

		MONGODB_URI: process.env.MONGODB_URI,
		MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
		JWT_SECRET: process.env.JWT_SECRET,
		SMTP_HOST: process.env.SMTP_HOST,
		SMTP_PORT: process.env.SMTP_PORT,
		SMTP_USER: process.env.SMTP_USER,
		SMTP_PASS: process.env.SMTP_PASS,
		SMTP_FROM: process.env.SMTP_FROM,
		BREVO_API_KEY: process.env.BREVO_API_KEY,
		BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
		BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME,
		MELHOR_ENVIO_ACCESS_TOKEN: process.env.MELHOR_ENVIO_ACCESS_TOKEN,
	},
});

const vercelHost =
	process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
		? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
		: process.env.NEXT_PUBLIC_VERCEL_URL;
const vercelUrl = vercelHost ? `https://${vercelHost}` : undefined;
const publicUrl = process.env.NEXT_PUBLIC_URL || vercelUrl;

if (!publicUrl) {
	throw new Error("Missing NEXT_PUBLIC_URL or NEXT_PUBLIC_VERCEL_URL variables!");
}

const _publicUrl = publicUrl;
export { _publicUrl as publicUrl };
