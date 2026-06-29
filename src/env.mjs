// @ts-check

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		STRIPE_SECRET_KEY: z.string().optional(),
		STRIPE_CURRENCY: z.string(),
		STRIPE_WEBHOOK_SECRET: z.string().optional(),
		CLOUDINARY_CLOUD_NAME: z.string().optional(),
		CLOUDINARY_API_KEY: z.string().optional(),
		CLOUDINARY_API_SECRET: z.string().optional(),
		CLOUDINARY_UPLOAD_FOLDER: z.string().optional(),

		ENABLE_STRIPE_TAX: z
			.string()
			.optional()
			.transform((str) => !!str),
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
		MELHOR_ENVIO_ENABLED: z.string().optional(),
		MELHOR_ENVIO_ENVIRONMENT: z.enum(["sandbox", "production"]).optional(),
		MELHOR_ENVIO_BASE_URL: z.string().url().optional(),
		MELHOR_ENVIO_ACCESS_TOKEN: z.string().optional(),
		MELHOR_ENVIO_ORIGIN_POSTAL_CODE: z.string().optional(),
		MELHOR_ENVIO_DEFAULT_WEIGHT_GRAMS: z.string().optional(),
		MELHOR_ENVIO_DEFAULT_LENGTH_CM: z.string().optional(),
		MELHOR_ENVIO_DEFAULT_WIDTH_CM: z.string().optional(),
		MELHOR_ENVIO_DEFAULT_HEIGHT_CM: z.string().optional(),
		MELHOR_ENVIO_USER_AGENT: z.string().optional(),
		MELHOR_ENVIO_CONTACT_EMAIL: z.string().email().optional(),
	},
	client: {
		NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
		NEXT_PUBLIC_URL: z.string().url().optional(),

		NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),

		NEXT_PUBLIC_NEWSLETTER_ENDPOINT: z.string().optional(),

		NEXT_PUBLIC_LANGUAGE: z.string().optional().default("pt-BR"),
	},
	runtimeEnv: {
		STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
		STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
		STRIPE_CURRENCY: process.env.STRIPE_CURRENCY,
		CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
		CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
		CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
		CLOUDINARY_UPLOAD_FOLDER: process.env.CLOUDINARY_UPLOAD_FOLDER,

		NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
		NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
		NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
		NEXT_PUBLIC_NEWSLETTER_ENDPOINT: process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT,

		ENABLE_STRIPE_TAX: process.env.ENABLE_STRIPE_TAX,

		NEXT_PUBLIC_LANGUAGE: process.env.NEXT_PUBLIC_LANGUAGE,
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
		MELHOR_ENVIO_ENABLED: process.env.MELHOR_ENVIO_ENABLED,
		MELHOR_ENVIO_ENVIRONMENT: process.env.MELHOR_ENVIO_ENVIRONMENT,
		MELHOR_ENVIO_BASE_URL: process.env.MELHOR_ENVIO_BASE_URL,
		MELHOR_ENVIO_ACCESS_TOKEN: process.env.MELHOR_ENVIO_ACCESS_TOKEN,
		MELHOR_ENVIO_ORIGIN_POSTAL_CODE: process.env.MELHOR_ENVIO_ORIGIN_POSTAL_CODE,
		MELHOR_ENVIO_DEFAULT_WEIGHT_GRAMS: process.env.MELHOR_ENVIO_DEFAULT_WEIGHT_GRAMS,
		MELHOR_ENVIO_DEFAULT_LENGTH_CM: process.env.MELHOR_ENVIO_DEFAULT_LENGTH_CM,
		MELHOR_ENVIO_DEFAULT_WIDTH_CM: process.env.MELHOR_ENVIO_DEFAULT_WIDTH_CM,
		MELHOR_ENVIO_DEFAULT_HEIGHT_CM: process.env.MELHOR_ENVIO_DEFAULT_HEIGHT_CM,
		MELHOR_ENVIO_USER_AGENT: process.env.MELHOR_ENVIO_USER_AGENT,
		MELHOR_ENVIO_CONTACT_EMAIL: process.env.MELHOR_ENVIO_CONTACT_EMAIL,
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
