"use server";

import { env } from "@/env.mjs";

export async function signForNewsletter(formData: FormData) {
	const email = formData.get("email");

	if (typeof email !== "string" || !email.includes("@")) {
		return null;
	}

	const result = await fetch(`${env.FASTAPI_API_URL}/communications/newsletter`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ email }),
	});

	if (!result.ok) return null;
	return { status: result.status };
}
