import "server-only";

import { env } from "@/env.mjs";

type EditorialApiItem = {
	id: string;
	type: string;
	slug: string;
	title: string;
	content: Record<string, unknown>;
	published: boolean;
	order: number;
	created_at: string;
	updated_at: string;
};

type EditorialFilter = { type: string; slug?: string };
type EditorialUpdate = {
	$set?: Record<string, unknown>;
	$setOnInsert?: Record<string, unknown>;
};

function toDocument(item: EditorialApiItem): Record<string, unknown> {
	return {
		...item.content,
		_id: item.id,
		type: item.type,
		slug: item.slug,
		title: item.title,
		published: item.published,
		order: item.order,
		createdAt: item.created_at,
		updatedAt: item.updated_at,
	};
}

async function list(type: string) {
	const response = await fetch(`${env.FASTAPI_API_URL}/editorial/internal/admin/${type}`, {
		headers: { "X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY },
		cache: "no-store",
	});
	if (!response.ok) throw new Error("FastAPI editorial unavailable");
	return (await response.json()) as EditorialApiItem[];
}

async function write(document: Record<string, unknown>) {
	const response = await fetch(`${env.FASTAPI_API_URL}/editorial/internal/admin`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
			"X-Actor-User-ID": String(document.updatedBy ?? document.createdBy ?? "next-internal"),
		},
		body: JSON.stringify({
			type: document.type,
			slug: document.slug,
			title: document.title,
			content: document,
			published: document.published,
			order: document.order,
		}),
		cache: "no-store",
	});
	if (!response.ok) throw new Error("Não foi possível salvar o conteúdo editorial no FastAPI.");
}

async function remove(filter: EditorialFilter) {
	const response = await fetch(
		`${env.FASTAPI_API_URL}/editorial/internal/admin/${encodeURIComponent(filter.type)}/${encodeURIComponent(filter.slug ?? "")}`,
		{
			method: "DELETE",
			headers: { "X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY },
			cache: "no-store",
		},
	);
	if (!response.ok && response.status !== 404)
		throw new Error("Não foi possível remover o conteúdo editorial.");
}

function matches(item: EditorialApiItem, filter: EditorialFilter) {
	return item.type === filter.type && (!filter.slug || item.slug === filter.slug);
}

function mergeDocument(current: Record<string, unknown> | null, update: EditorialUpdate) {
	return {
		...(current ?? {}),
		...(update.$setOnInsert ?? {}),
		...(update.$set ?? {}),
	};
}

export async function getEditorialApiStore() {
	return {
		collection<T extends Record<string, unknown>>(_name: string) {
			return {
				find(filter: EditorialFilter) {
					return {
						sort(_sort?: Record<string, number>) {
							return {
								async toArray() {
									return (await list(filter.type))
										.map(toDocument)
										.filter((item) => matches(item as EditorialApiItem, filter)) as T[];
								},
							};
						},
					};
				},
				async updateOne(filter: EditorialFilter, update: EditorialUpdate, options?: { upsert?: boolean }) {
					const items = await list(filter.type);
					const existing = items.find((item) => matches(item, filter));
					const current = existing ? toDocument(existing) : null;
					const document = mergeDocument(current, update);
					if (!document.type || !document.slug || !document.title) {
						throw new Error("Conteúdo editorial inválido.");
					}
					if (existing && document.slug !== existing.slug) await remove(filter);
					if (existing || options?.upsert) await write(document);
				},
				async bulkWrite(
					operations: Array<{ updateOne: { filter: EditorialFilter; update: EditorialUpdate } }>,
				) {
					for (const operation of operations) {
						await this.updateOne(operation.updateOne.filter, operation.updateOne.update);
					}
				},
				async deleteOne(filter: EditorialFilter) {
					await remove(filter);
				},
			};
		},
	};
}
