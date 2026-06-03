import { v2 as cloudinary } from "cloudinary";
import { env } from "@/env.mjs";

let configured = false;

export function isCloudinaryConfigured() {
	return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

export function getCloudinaryClient() {
	if (!isCloudinaryConfigured()) {
		throw new Error(
			"Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
		);
	}

	if (!configured) {
		cloudinary.config({
			cloud_name: env.CLOUDINARY_CLOUD_NAME,
			api_key: env.CLOUDINARY_API_KEY,
			api_secret: env.CLOUDINARY_API_SECRET,
			secure: true,
		});
		configured = true;
	}

	return cloudinary;
}
