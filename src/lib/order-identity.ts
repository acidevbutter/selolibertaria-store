import { randomUUID } from "node:crypto";

export function createInternalOrderId() {
	return `ord_${randomUUID().replaceAll("-", "")}`;
}
