import process from "node:process";
import nextEnv from "@next/env";
import { MongoClient } from "mongodb";

nextEnv.loadEnvConfig(process.cwd());

function required(name) {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
	return value;
}

const product = {
	id: "product_virus-do-beijo",
	slug: "virus-do-beijo",
	name: "Virus do Beijo",
	description: "Livro do Selo Libertária para validar vitrine, carrinho e checkout Mercado Pago.",
	images: ["/images/selolibertaria/virus-do-beijo-cover.png"],
	category: { name: "Livros", slug: "livros" },
	stock: 20,
	productType: "book",
	format: "print",
	order: 1,
	published: true,
	variants: [
		{
			id: "variant_virus-do-beijo_impresso",
			label: "Impresso",
			slug: "impresso",
			description: "Edição impressa do livro Virus do Beijo.",
			images: ["/images/selolibertaria/virus-do-beijo-cover.png"],
			price: 4200,
			currency: "BRL",
			stock: 20,
			published: true,
			order: 1,
		},
	],
};

async function run() {
	const client = new MongoClient(required("MONGODB_URI"), { serverSelectionTimeoutMS: 5000 });
	await client.connect();
	try {
		const collection = client.db(required("MONGODB_DB_NAME")).collection("catalogProducts");
		await collection.createIndex({ slug: 1 }, { unique: true });
		await collection.createIndex({ "variants.id": 1 }, { unique: true });
		const now = new Date();
		const result = await collection.updateOne(
			{ slug: product.slug },
			{ $set: { ...product, updatedAt: now }, $setOnInsert: { createdAt: now } },
			{ upsert: true },
		);
		console.log(
			`[catalog-seed] ${result.upsertedCount ? "created" : "updated"}: ${product.slug} (${product.variants[0].id})`,
		);
	} finally {
		await client.close();
	}
}

run().catch((error) => {
	console.error("[catalog-seed] failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
