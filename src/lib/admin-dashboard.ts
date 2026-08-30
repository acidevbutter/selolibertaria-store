import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import {
	AWAITING_ACTION_STATUSES,
	getDisputeRelatedStatuses,
	normalizeDisplayPaymentStatus,
	PROCESSING_RELATED_STATUSES,
} from "@/lib/payment-status-display";

export type AdminDashboardParams = {
	status: string;
	period: string;
	sort: string;
};

type PurchaseRecord = {
	id: string;
	userEmail: string;
	amountTotal: number;
	currency: string;
	status: string;
	createdAt: string;
	discountTotal: number;
	couponCode: string | null;
	refundedAmount: number;
	fulfillmentStatus: string | null;
	trackingNumber: string | null;
};

export type AdminDashboardRecentPurchase = PurchaseRecord;

type MoneyTotals = Array<{ currency: string; amountCents: number }>;

type TopCustomer = {
	email: string;
	count: number;
	paidCount: number;
	totalSpentCents: number;
};

type PaymentFunnel = {
	awaitingAction: number;
	processing: number;
	paid: number;
	failedCanceled: number;
	refunded: number;
	disputed: number;
};

type FulfillmentQueue = {
	received: number;
	producing: number;
	shipped: number;
	paidWithoutFulfillment: number;
	shippedWithoutTracking: number;
};

type OpsHealth = {
	webhooksFailed: number;
	webhooksPending: number;
	emailFailed: number;
	emailPending: number;
	manualTouches: number;
};

export type AdminDashboardData = {
	usersCount: number;
	filteredPurchases: number;
	buyersCount: number;
	couponOrdersCount: number;
	couponOrdersRate: number;
	paymentFunnel: PaymentFunnel;
	fulfillmentQueue: FulfillmentQueue;
	opsHealth: OpsHealth;
	revenueByCurrency: MoneyTotals;
	refundedByCurrency: MoneyTotals;
	discountByCurrency: MoneyTotals;
	netRevenueByCurrency: MoneyTotals;
	averageOrderValueByCurrency: MoneyTotals;
	recentDisputesCount: number;
	recentRefundsCount: number;
	primaryCurrency: string;
	hasMultipleCurrencies: boolean;
	revenueSeriesDays: string[];
	revenueSeriesCents: number[];
	revenueZoomBrushPoints: Array<{ x: number; y: number }>;
	recentPurchases: AdminDashboardRecentPurchase[];
	topCustomers: TopCustomer[];
};

type StatusGroup =
	| "awaiting_action"
	| "processing"
	| "paid"
	| "failed_canceled"
	| "refunded"
	| "disputed"
	| "other";

function asDate(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function resolveDashboardSince(period: string, now = new Date()) {
	if (period === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	if (period === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	if (period === "90d") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
	if (period === "365d") return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
	return null;
}

export function normalizeAdminPaymentStatus(status?: string | null) {
	return normalizeDisplayPaymentStatus(status);
}

export function isPaidStatus(status: string) {
	const normalized = normalizeAdminPaymentStatus(status);
	return normalized === "paid" || normalized === "succeeded" || normalized === "no_payment_required";
}

function isRefundedStatus(status: string) {
	return normalizeAdminPaymentStatus(status) === "refunded";
}

export function classifyPaymentStatus(status: string): StatusGroup {
	const normalized = normalizeAdminPaymentStatus(status);
	if (AWAITING_ACTION_STATUSES.has(normalized)) {
		return "awaiting_action";
	}
	if (PROCESSING_RELATED_STATUSES.has(normalized)) {
		return "processing";
	}
	if (isPaidStatus(normalized)) return "paid";
	if (normalized === "refunded" || normalized === "refund_updated") return "refunded";
	if (normalized === "disputed" || normalized === "won" || normalized === "lost") return "disputed";
	if (
		normalized === "failed" ||
		normalized === "canceled" ||
		normalized === "cancel" ||
		normalized === "expired" ||
		normalized === "voided" ||
		normalized === "uncollectible"
	) {
		return "failed_canceled";
	}
	return "other";
}

function resolveDashboardStatusMatch(status: string) {
	const normalized = normalizeAdminPaymentStatus(status);
	if (!normalized || normalized === "all") return null;
	if (normalized === "disputed") return getDisputeRelatedStatuses();
	if (normalized === "processing") return Array.from(PROCESSING_RELATED_STATUSES);
	return [normalized];
}

function addMoney(map: Map<string, number>, currency: string, amountCents: number) {
	if (!Number.isFinite(amountCents) || amountCents === 0) return;
	const normalizedCurrency = currency.trim().toUpperCase() || "USD";
	map.set(normalizedCurrency, (map.get(normalizedCurrency) ?? 0) + Math.round(amountCents));
}

function mapToMoneyTotals(map: Map<string, number>): MoneyTotals {
	return Array.from(map.entries())
		.map(([currency, amountCents]) => ({ currency, amountCents }))
		.sort((a, b) => b.amountCents - a.amountCents);
}

function comparePurchases(sort: string, a: PurchaseRecord, b: PurchaseRecord) {
	if (sort === "date-asc") return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
	if (sort === "amount-desc") return b.amountTotal - a.amountTotal;
	if (sort === "amount-asc") return a.amountTotal - b.amountTotal;
	return a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0;
}

function buildRecentSeries({
	purchases,
	now,
	since,
	primaryCurrency,
}: {
	purchases: PurchaseRecord[];
	now: Date;
	since: Date | null;
	primaryCurrency: string;
}) {
	const effectiveSince = since ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const dayKey = (date: Date) => date.toISOString().slice(0, 10);
	const paidByDay = new Map<string, number>();

	for (const purchase of purchases) {
		if (!isPaidStatus(purchase.status) || purchase.currency !== primaryCurrency) continue;
		const createdAt = asDate(purchase.createdAt);
		if (!createdAt) continue;
		const key = dayKey(createdAt);
		paidByDay.set(key, (paidByDay.get(key) ?? 0) + purchase.amountTotal);
	}

	const days: string[] = [];
	for (
		let cursor = new Date(effectiveSince);
		cursor <= now;
		cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
	) {
		days.push(dayKey(cursor));
	}

	const series = days.map((key) => paidByDay.get(key) ?? 0);
	return {
		revenueSeriesDays: days,
		revenueSeriesCents: series,
		revenueZoomBrushPoints: days.map((key) => ({ x: new Date(key).getTime(), y: paidByDay.get(key) ?? 0 })),
	};
}

export async function getAdminDashboardData({
	status,
	period,
	sort,
}: AdminDashboardParams): Promise<AdminDashboardData> {
	const now = new Date();
	const since = resolveDashboardSince(period, now);
	const token = (await cookies()).get("session")?.value;
	const query = since ? `?since=${encodeURIComponent(since.toISOString())}` : "";
	const response = token
		? await fetch(`${env.FASTAPI_API_URL}/orders/dashboard${query}`, {
				headers: { authorization: `Bearer ${token}` },
				cache: "no-store",
			})
		: null;
	if (!response?.ok) throw new Error("FastAPI dashboard unavailable");
	const dashboard = (await response.json()) as {
		users_count: number;
		purchases: Array<Record<string, unknown>>;
		webhooks_failed: number;
		webhooks_pending: number;
		email_failed: number;
		email_pending: number;
		manual_touches: number;
	};
	const statusMatch = resolveDashboardStatusMatch(status);
	const purchases: PurchaseRecord[] = dashboard.purchases
		.filter((purchase) => !statusMatch || statusMatch.includes(String(purchase.status)))
		.map((purchase) => ({
			userEmail: String(purchase.user_email ?? "(unknown)"),
			id: String(purchase.id),
			amountTotal: Number(purchase.amount_total ?? 0),
			currency: String(purchase.currency ?? "USD"),
			status: String(purchase.status ?? "unknown"),
			createdAt: String(purchase.created_at),
			discountTotal: Number(purchase.discount_total ?? 0),
			couponCode: typeof purchase.coupon_code === "string" ? purchase.coupon_code : null,
			refundedAmount: Number(purchase.refunded_amount ?? 0),
			fulfillmentStatus: typeof purchase.fulfillment_status === "string" ? purchase.fulfillment_status : null,
			trackingNumber: typeof purchase.tracking_number === "string" ? purchase.tracking_number : null,
		}));
	const usersCount = dashboard.users_count;
	const webhooksFailed = dashboard.webhooks_failed;
	const webhooksPending = dashboard.webhooks_pending;
	const emailFailed = dashboard.email_failed;
	const emailPending = dashboard.email_pending;
	const manualTouches = dashboard.manual_touches;

	const normalizedPurchases = purchases.map((purchase) => ({
		...purchase,
		createdAt: asDate(String(purchase.createdAt))?.toISOString() ?? new Date(0).toISOString(),
		currency: (purchase.currency || "USD").toUpperCase(),
		status: purchase.status || "unknown",
		userEmail: purchase.userEmail || "(unknown)",
		discountTotal: Number.isFinite(purchase.discountTotal) ? purchase.discountTotal : 0,
		refundedAmount: Number.isFinite(purchase.refundedAmount) ? purchase.refundedAmount : 0,
		amountTotal: Number.isFinite(purchase.amountTotal) ? purchase.amountTotal : 0,
	}));

	const sortedPurchases = [...normalizedPurchases].sort((a, b) => comparePurchases(sort, a, b));
	const recentPurchases = sortedPurchases.slice(0, 10);

	const buyers = new Set<string>();
	const paidRevenueByCurrency = new Map<string, number>();
	const discountByCurrency = new Map<string, number>();
	const refundedByCurrency = new Map<string, number>();
	const paidCountsByCurrency = new Map<string, number>();
	const topCustomersMap = new Map<string, TopCustomer>();
	const paymentFunnel: PaymentFunnel = {
		awaitingAction: 0,
		processing: 0,
		paid: 0,
		failedCanceled: 0,
		refunded: 0,
		disputed: 0,
	};
	const fulfillmentQueue: FulfillmentQueue = {
		received: 0,
		producing: 0,
		shipped: 0,
		paidWithoutFulfillment: 0,
		shippedWithoutTracking: 0,
	};

	let couponOrdersCount = 0;
	let recentDisputesCount = 0;
	let recentRefundsCount = 0;

	for (const purchase of normalizedPurchases) {
		const email = purchase.userEmail || "(unknown)";
		const currency = purchase.currency || "USD";
		const paid = isPaidStatus(purchase.status);
		const groupedStatus = classifyPaymentStatus(purchase.status);

		buyers.add(email);

		if (purchase.couponCode?.trim()) couponOrdersCount += 1;
		if (groupedStatus === "disputed") recentDisputesCount += 1;
		if (groupedStatus === "refunded") recentRefundsCount += 1;

		if (groupedStatus === "awaiting_action") paymentFunnel.awaitingAction += 1;
		if (groupedStatus === "processing") paymentFunnel.processing += 1;
		if (groupedStatus === "paid") paymentFunnel.paid += 1;
		if (groupedStatus === "failed_canceled") paymentFunnel.failedCanceled += 1;
		if (groupedStatus === "refunded") paymentFunnel.refunded += 1;
		if (groupedStatus === "disputed") paymentFunnel.disputed += 1;

		if (purchase.fulfillmentStatus === "received") fulfillmentQueue.received += 1;
		if (purchase.fulfillmentStatus === "producing") fulfillmentQueue.producing += 1;
		if (purchase.fulfillmentStatus === "shipped") fulfillmentQueue.shipped += 1;
		if (paid && !purchase.fulfillmentStatus) fulfillmentQueue.paidWithoutFulfillment += 1;
		if (purchase.fulfillmentStatus === "shipped" && !purchase.trackingNumber?.trim()) {
			fulfillmentQueue.shippedWithoutTracking += 1;
		}

		if (paid) {
			addMoney(paidRevenueByCurrency, currency, purchase.amountTotal);
			paidCountsByCurrency.set(currency, (paidCountsByCurrency.get(currency) ?? 0) + 1);
		}
		if (purchase.discountTotal > 0) addMoney(discountByCurrency, currency, purchase.discountTotal);

		const refundedAmount =
			purchase.refundedAmount > 0
				? purchase.refundedAmount
				: isRefundedStatus(purchase.status)
					? purchase.amountTotal
					: 0;
		if (refundedAmount > 0) addMoney(refundedByCurrency, currency, refundedAmount);

		let topCustomer = topCustomersMap.get(email);
		if (!topCustomer) {
			topCustomer = { email, count: 0, paidCount: 0, totalSpentCents: 0 };
			topCustomersMap.set(email, topCustomer);
		}
		topCustomer.count += 1;
		if (paid) {
			topCustomer.paidCount += 1;
			topCustomer.totalSpentCents += purchase.amountTotal;
		}
	}

	const revenueByCurrency = mapToMoneyTotals(paidRevenueByCurrency);
	const discountByCurrencyTotals = mapToMoneyTotals(discountByCurrency);
	const refundedByCurrencyTotals = mapToMoneyTotals(refundedByCurrency);

	const averageOrderValueByCurrency = revenueByCurrency.map(({ currency, amountCents }) => ({
		currency,
		amountCents: Math.round(amountCents / Math.max(paidCountsByCurrency.get(currency) ?? 1, 1)),
	}));
	const netRevenueByCurrency = revenueByCurrency.map(({ currency, amountCents }) => ({
		currency,
		amountCents: amountCents - (refundedByCurrency.get(currency) ?? 0),
	}));

	const primaryCurrency = revenueByCurrency[0]?.currency ?? recentPurchases[0]?.currency ?? "USD";
	const hasMultipleCurrencies = revenueByCurrency.length > 1;
	const topCustomers = Array.from(topCustomersMap.values())
		.sort((a, b) => {
			if (!hasMultipleCurrencies && b.totalSpentCents !== a.totalSpentCents) {
				return b.totalSpentCents - a.totalSpentCents;
			}
			if (b.paidCount !== a.paidCount) return b.paidCount - a.paidCount;
			return b.count - a.count;
		})
		.slice(0, 5);

	return {
		usersCount,
		filteredPurchases: normalizedPurchases.length,
		buyersCount: buyers.size,
		couponOrdersCount,
		couponOrdersRate: normalizedPurchases.length > 0 ? couponOrdersCount / normalizedPurchases.length : 0,
		paymentFunnel,
		fulfillmentQueue,
		opsHealth: {
			webhooksFailed,
			webhooksPending,
			emailFailed,
			emailPending,
			manualTouches,
		},
		revenueByCurrency,
		refundedByCurrency: refundedByCurrencyTotals,
		discountByCurrency: discountByCurrencyTotals,
		netRevenueByCurrency,
		averageOrderValueByCurrency,
		recentDisputesCount,
		recentRefundsCount,
		primaryCurrency,
		hasMultipleCurrencies,
		...buildRecentSeries({
			purchases: normalizedPurchases,
			now,
			since,
			primaryCurrency,
		}),
		recentPurchases,
		topCustomers,
	};
}
