import { type Db, MongoClient } from "mongodb";
import { env } from "@/env.mjs";
import type { SupportedCurrency } from "@/lib/currency";

// Reuse connection in development to avoid creating multiple connections during HMR
interface GlobalMongoCache {
	client: MongoClient | null;
	promise: Promise<MongoClient> | null;
	indexesEnsured: boolean;
	indexesPromise: Promise<void> | null;
}

// @ts-ignore
const globalForMongo: { _mongo?: GlobalMongoCache } = globalThis;

const mongoCache: GlobalMongoCache = globalForMongo._mongo ?? {
	client: null,
	promise: null,
	indexesEnsured: false,
	indexesPromise: null,
};

if (!globalForMongo._mongo) {
	globalForMongo._mongo = mongoCache;
}

async function connectWithRetry(uri: string, attempts = 2, delayMs = 400): Promise<MongoClient> {
	let lastErr: unknown;
	for (let i = 0; i < attempts; i++) {
		try {
			return await MongoClient.connect(uri, {
				serverSelectionTimeoutMS: 4000,
			});
		} catch (err) {
			lastErr = err;
			if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
		}
	}
	throw lastErr;
}

export async function getMongoClient() {
	if (mongoCache.client) return mongoCache.client;
	if (!mongoCache.promise) {
		if (!env.MONGODB_URI) throw new Error("Missing MONGODB_URI env variable");

		const uri = env.MONGODB_URI.trim();

		const looksLikeAtlasButWrongHost = uri.includes("mongodb.net") && /mongodb:\/\/mongo[:/]/.test(uri);
		if (looksLikeAtlasButWrongHost) {
			throw new Error(
				"Detectado host 'mongo' em URI aparentemente do Atlas. Copie a URI completa do Atlas (mongodb+srv://...) e substitua em MONGODB_URI.",
			);
		}

		const isSrv = uri.startsWith("mongodb+srv://");
		const isLocalDockerHost = !isSrv && /mongodb:\/\/mongo(?::|\/)/.test(uri);

		mongoCache.promise = (async () => {
			const attempted: string[] = [];

			async function tryUri(current: string) {
				attempted.push(current);
				return await connectWithRetry(current);
			}

			let primaryError: unknown = null;
			try {
				return await tryUri(uri);
			} catch (err: unknown) {
				primaryError = err;
				const errObj = err as {
					message?: string;
					cause?: { message?: string };
				};
				const msg = String(errObj?.message || "");
				const dnsFailure =
					/EAI_AGAIN|ENOTFOUND|getaddrinfo/.test(msg) || /EAI_AGAIN/.test(String(errObj?.cause?.message));
				if (isLocalDockerHost && dnsFailure) {
					const localhostUri = uri.replace(/mongodb:\/\/mongo/, "mongodb://localhost");
					console.warn(`[Mongo] Host 'mongo' unreachable (DNS). Trying fallback: ${localhostUri}`);
					try {
						return await tryUri(localhostUri);
					} catch (err2: unknown) {
						const atlas = process.env.MONGODB_ATLAS_URI;
						if (atlas) {
							console.warn("[Mongo] Fallback localhost failed. Trying MONGODB_ATLAS_URI (Atlas).");
							try {
								return await tryUri(atlas);
							} catch (err3: unknown) {
								throw buildEnhancedError([primaryError, err2, err3], attempted);
							}
						}
						throw buildEnhancedError([primaryError, err2], attempted);
					}
				}
				throw enhanceIfAtlasMismatch(
					err instanceof Error
						? err
						: new Error(String((err as { message?: string })?.message || "Unknown error")),
					uri,
				);
			}
		})();
	}
	mongoCache.client = await mongoCache.promise;
	return mongoCache.client;
}

function enhanceIfAtlasMismatch(err: Error, uri: string) {
	if (/mongodb\.net/.test(uri) && !uri.startsWith("mongodb+srv://")) {
		err.message +=
			"\n[Hint] Atlas URIs usually use the format mongodb+srv://. Check the string copied from the Atlas dashboard.";
	}
	return err;
}

function buildEnhancedError(errors: unknown[], attempted: string[]) {
	const e = new Error(
		`Could not connect to MongoDB after fallbacks. Attempts: ${attempted.join(", ")}. Last error: ${String((errors[errors.length - 1] as { message?: string })?.message)}`,
	);
	(
		e as unknown as {
			causes: Array<{ message: string | undefined; stack: string | undefined }>;
		}
	).causes = errors.map((x) => {
		const errX = x as { message?: string; stack?: string };
		return { message: errX.message, stack: errX.stack };
	});
	return e;
}

export async function getDb(): Promise<Db> {
	const client = await getMongoClient();
	const dbName = env.MONGODB_DB_NAME;
	return client.db(dbName);
}

export async function ensureIndexes() {
	if (mongoCache.indexesEnsured) return;
	if (!mongoCache.indexesPromise) {
		mongoCache.indexesPromise = (async () => {
			const db = await getDb();
			const users = db.collection("users");
			const sessions = db.collection("sessions");
			const createOptionalIndex = (operation: Promise<unknown>) => operation.catch(() => undefined);

			await Promise.all([
				users.createIndex({ email: 1 }, { unique: true }),
				createOptionalIndex(users.createIndex({ "verification.token": 1 }, { sparse: true })),
				createOptionalIndex(users.createIndex({ "accountAccessTokens.tokenHash": 1 }, { sparse: true })),
				createOptionalIndex(
					users.createIndex(
						{ "identities.provider": 1, "identities.providerAccountId": 1 },
						{ sparse: true, unique: true },
					),
				),
				createOptionalIndex(sessions.createIndex({ userId: 1, jwt: 1 })),
				createOptionalIndex(sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })),
				createOptionalIndex(db.collection("webhooks").createIndex({ receivedAt: -1 })),
				createOptionalIndex(db.collection("webhooks").createIndex({ eventId: 1 })),
				createOptionalIndex(db.collection("communication").createIndex({ sentAt: -1 })),
				createOptionalIndex(db.collection("communication").createIndex({ status: 1, sentAt: -1 })),
				createOptionalIndex(db.collection("communication").createIndex({ kind: 1, sentAt: -1 })),
				createOptionalIndex(db.collection("communication").createIndex({ email: 1, sentAt: -1 })),
				createOptionalIndex(db.collection("communication").createIndex({ purchaseId: 1, sentAt: -1 })),
				createOptionalIndex(
					db
						.collection("favorites")
						.createIndex({ userId: 1, productSlug: 1, variantId: 1 }, { unique: true }),
				),
				createOptionalIndex(db.collection("favorites").createIndex({ productSlug: 1, createdAt: -1 })),
				createOptionalIndex(
					db.collection("promotions").createIndex({ status: 1, kind: 1, priority: -1, updatedAt: -1 }),
				),
				createOptionalIndex(
					db.collection("editorialContent").createIndex({ type: 1, slug: 1 }, { unique: true }),
				),
				createOptionalIndex(
					db.collection("editorialContent").createIndex({ type: 1, published: 1, order: 1, updatedAt: -1 }),
				),
				createOptionalIndex(
					db.collection("promotions").createIndex({ "schedule.startsAt": 1, "schedule.endsAt": 1 }),
				),
				createOptionalIndex(
					db.collection("promotionCodes").createIndex({ codeNormalized: 1 }, { unique: true }),
				),
				createOptionalIndex(db.collection("promotionCodes").createIndex({ promotionId: 1, status: 1 })),
				createOptionalIndex(
					db
						.collection("promotionRedemptions")
						.createIndex({ promotionCodeId: 1, status: 1, consumedAt: -1 }),
				),
				createOptionalIndex(
					db.collection("promotionRedemptions").createIndex({ userId: 1, promotionCodeId: 1, status: 1 }),
				),
				createOptionalIndex(
					db.collection("promotionNotifications").createIndex(
						{
							promotionId: 1,
							userId: 1,
							productSlug: 1,
							variantId: 1,
							effectivePrice: 1,
						},
						{ unique: true },
					),
				),
				createOptionalIndex(db.collection("promotionNotifications").createIndex({ status: 1, createdAt: 1 })),
				createOptionalIndex(db.collection("productAuditLogs").createIndex({ slug: 1, createdAt: -1 })),
				createOptionalIndex(db.collection("catalogProducts").createIndex({ slug: 1 }, { unique: true })),
				createOptionalIndex(
					db.collection("catalogProducts").createIndex({ published: 1, order: 1, name: 1 }),
				),
				createOptionalIndex(
					db.collection("catalogProducts").createIndex({ "category.slug": 1, published: 1, order: 1 }),
				),
				createOptionalIndex(
					db.collection("catalogProducts").createIndex({ "variants.id": 1 }, { unique: true }),
				),
			]);

			await sessions.updateMany({ expiresAt: { $exists: false }, expires: { $gt: 0 } }, [
				{ $set: { expiresAt: { $toDate: "$expires" } } },
			]);
			mongoCache.indexesEnsured = true;
		})().catch((error) => {
			mongoCache.indexesPromise = null;
			throw error;
		});
	}
	await mongoCache.indexesPromise;
}

export type WithId<T> = T & { _id: string };

export type UserCartItem = {
	productId: string;
	variantId: string;
	quantity: number;
};

export interface UserCart {
	items: Array<UserCartItem>;
	couponCode?: string | null;
}

export interface UserDoc {
	_id?: string;
	email: string;
	name?: string;
	cpf?: string;
	role?: "admin" | "vendor" | "customer";
	access?: {
		blockedAt?: Date | null;
		blockedBy?: string | null;
		blockedReason?: string | null;
	};
	phone?: string;
	phoneDetails?: {
		country?: string;
		dialCode?: string;
		national?: string;
		display?: string;
	};
	address?: {
		line1?: string;
		line2?: string;
		number?: string;
		complement?: string;
		district?: string;
		city?: string;
		state?: string;
		postalCode?: string;
		country?: string;
	};
	passwordHash?: string; // password hash
	identities?: Array<{
		provider: "google" | "facebook" | "instagram";
		providerAccountId: string;
		email?: string | null;
		displayName?: string | null;
		avatarUrl?: string | null;
		linkedAt: Date;
		lastLoginAt?: Date;
	}>;
	authMethods?: string[];
	lastLoginProvider?: string;
	profileImage?: string | null;
	marketing?: {
		email?: {
			optIn?: boolean;
			optInAt?: Date | null;
			optInSource?: string | null;
			unsubscribedAt?: Date | null;
			lastPreferenceChangeAt?: Date | null;
		};
	};
	preferredCurrency?: SupportedCurrency;
	cart?: UserCart;
	purchases?: Array<{
		id: string;
		createdAt: Date;
		status: string; // e.g. paid, open, incomplete
		amountTotal: number;
		currency: string;
		buyer?: {
			fullName?: string | null;
			email?: string | null;
			cpf?: string | null;
			phone?: string | null;
		} | null;
		items: Array<{
			priceId?: string | null;
			productId?: string | null;
			name?: string | null;
			quantity: number;
			unitAmount?: number | null;
		}>;
		paymentReferenceId?: string | null;
		relatedIds?: {
			mercadoPagoPaymentId?: string;
		};
		cart?: UserCart | null;
	}>;
	accountAccessTokens?: Array<{
		tokenHash: string;
		orderId: string;
		expiresAt: Date;
		createdAt: Date;
		usedAt?: Date | null;
	}>;
	verified?: boolean;
	verification?: { token: string; expiresAt: Date } | null;
	createdAt: Date;
	updatedAt: Date;
}
