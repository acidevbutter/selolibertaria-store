"use client";

import { normalizeDisplayPaymentStatus } from "@/lib/payment-status-display";
import { Badge } from "@/ui/shadcn/badge";

const STATUS_LABELS: Record<string, string> = {
	paid: "Pago",
	processed: "Processado",
	sent: "Enviado",
	succeeded: "Concluído",
	won: "Resolvido",
	disputed: "Em disputa",
	failed: "Com falha",
	lost: "Perdido",
	pending: "Pendente",
	processing: "Em processamento",
	open: "Em aberto",
	unpaid: "Não pago",
	canceled: "Cancelado",
	voided: "Cancelado",
	unknown: "Sem status definido",
	requires_action: "Ação necessária",
};

export function StatusBadge({ status }: { status: string }) {
	const s = normalizeDisplayPaymentStatus(status);
	const normalizedLabel = (s || status || "").replaceAll("_", " ").trim().toLowerCase();
	const label =
		STATUS_LABELS[s] || STATUS_LABELS[normalizedLabel] || normalizedLabel || "Sem status definido";
	if (s === "paid" || s === "processed" || s === "sent" || s === "succeeded" || s === "won")
		return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{label}</Badge>;
	if (s === "disputed")
		return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{label}</Badge>;
	if (s === "failed") return <Badge className="bg-red-100 text-red-800 border-red-200">{label}</Badge>;
	if (s === "lost") return <Badge className="bg-red-100 text-red-800 border-red-200">{label}</Badge>;
	if (s === "pending" || s === "processing")
		return <Badge className="bg-amber-100 text-amber-800 border-amber-200">{label}</Badge>;
	if (s === "canceled" || s === "voided")
		return <Badge className="bg-gray-200 text-gray-800 border-gray-300">{label}</Badge>;
	return <Badge variant="secondary">{label}</Badge>;
}
