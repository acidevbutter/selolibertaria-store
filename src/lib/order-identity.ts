import { ObjectId } from "mongodb";

export interface OrderRelatedIds {
	/** Legacy Payments API `payment_id`. Kept for orders placed before the Orders API migration. */
	mercadoPagoPaymentId?: string;
	/** Orders API `order_id`, set by the new adapter (see DEV-155/DEV-156). */
	mercadoPagoOrderId?: string;
}

export interface OrderIdentifierLike {
	id: string;
	relatedIds?: OrderRelatedIds | null;
}

export function createInternalOrderId() {
	return `ord_${new ObjectId().toHexString()}`;
}

export function matchesOrderIdentifier(order: OrderIdentifierLike, identifier: string) {
	return (
		order.id === identifier ||
		order.relatedIds?.mercadoPagoPaymentId === identifier ||
		order.relatedIds?.mercadoPagoOrderId === identifier
	);
}
