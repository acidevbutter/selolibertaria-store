import { createHash } from "node:crypto";
import process from "node:process";
import nextEnv from "@next/env";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function getRequiredEnv(name) {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`Variável obrigatória ausente: ${name}`);
	}
	return value;
}

function sanitizeSegment(value) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function isManagedImage(url) {
	try {
		const parsed = new URL(url);
		return parsed.hostname === "res.cloudinary.com";
	} catch {
		return false;
	}
}

function buildPublicId({ productId, productName, imageUrl, index }) {
	const slug = sanitizeSegment(productName) || productId.toLowerCase();
	const hash = createHash("sha1").update(imageUrl).digest("hex").slice(0, 12);
	return `${slug}-${index + 1}-${hash}`;
}

async function ensureCloudinaryImage({ imageUrl, folder, publicId }) {
	try {
		const response = await fetch(imageUrl);
		if (!response.ok) {
			throw new Error(`Falha ao baixar imagem remota (${response.status}): ${imageUrl}`);
		}

		const buffer = Buffer.from(await response.arrayBuffer());
		const result = await new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{
					folder,
					public_id: publicId,
					overwrite: false,
					unique_filename: false,
					resource_type: "image",
				},
				(error, uploadResult) => {
					if (error || !uploadResult) {
						reject(error || new Error("Falha ao enviar imagem para o serviço de mídia."));
						return;
					}

					resolve(uploadResult);
				},
			);

			stream.end(buffer);
		});
		return result.secure_url;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (!/already exists/i.test(message)) {
			throw error;
		}

		const existing = await cloudinary.api.resource(`${folder}/${publicId}`, {
			resource_type: "image",
		});
		return existing.secure_url;
	}
}

async function run() {
	const stripeSecretKey = getRequiredEnv("STRIPE_SECRET_KEY");
	const cloudName = getRequiredEnv("CLOUDINARY_CLOUD_NAME");
	const apiKey = getRequiredEnv("CLOUDINARY_API_KEY");
	const apiSecret = getRequiredEnv("CLOUDINARY_API_SECRET");
	const folder = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "products";

	const stripe = new Stripe(stripeSecretKey, { apiVersion: undefined });
	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true,
	});

	let scannedProducts = 0;
	let updatedProducts = 0;
	let migratedImages = 0;

	for await (const product of stripe.products.list({ limit: 100 })) {
		scannedProducts += 1;
		const currentImages = product.images ?? [];
		if (!currentImages.length) continue;
		if (currentImages.every((url) => isManagedImage(url))) continue;

		const nextImages = [];
		let productChanged = false;

		for (const [index, imageUrl] of currentImages.entries()) {
			if (isManagedImage(imageUrl)) {
				nextImages.push(imageUrl);
				continue;
			}

			const publicId = buildPublicId({
				productId: product.id,
				productName: product.name,
				imageUrl,
				index,
			});
			const migratedUrl = await ensureCloudinaryImage({
				imageUrl,
				folder,
				publicId,
			});
			nextImages.push(migratedUrl);
			productChanged = true;
			migratedImages += 1;
		}

		if (!productChanged) continue;

		await stripe.products.update(product.id, { images: nextImages });
		updatedProducts += 1;
		console.log(`Produto atualizado: ${product.name} (${product.id})`);
	}

	console.log("");
	console.log(`Produtos verificados: ${scannedProducts}`);
	console.log(`Produtos atualizados: ${updatedProducts}`);
	console.log(`Imagens migradas: ${migratedImages}`);
}

run().catch((error) => {
	console.error("Falha ao migrar imagens dos produtos:", error instanceof Error ? error.message : error);
	process.exit(1);
});
