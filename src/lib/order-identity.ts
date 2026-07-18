import { ObjectId } from "mongodb";

export interface OrderIdentifierLike {
	id: string;
	relatedIds?: {
		mercadoPagoPaymentId?: string;
	} | null;
}

export function createInternalOrderId() {
	return `ord_${new ObjectId().toHexString()}`;
}

export function matchesOrderIdentifier(order: OrderIdentifierLike, identifier: string) {
	return order.id === identifier || order.relatedIds?.mercadoPagoPaymentId === identifier;
}
