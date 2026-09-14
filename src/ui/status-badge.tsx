import { StatusBadge as AdminStatusBadge } from "@/app/admin/_components/ui/StatusBadge";
import { normalizeDisplayPaymentStatus } from "@/lib/payment-status-display";

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

const NEUTRAL_STATUSES = new Set(["paid", "processed", "succeeded", "won"]);
const ACTIVE_STATUSES = new Set(["sent", "pending", "processing", "open", "requires_action"]);

/** Payment/order status — three tones only (neutral/active/alert), never shadcn green/red. */
export function StatusBadge({ status }: { status: string }) {
	const s = normalizeDisplayPaymentStatus(status);
	const normalizedLabel = (s || status || "").replaceAll("_", " ").trim().toLowerCase();
	const label =
		STATUS_LABELS[s] || STATUS_LABELS[normalizedLabel] || normalizedLabel || "Sem status definido";

	const tone = NEUTRAL_STATUSES.has(s) ? "neutral" : ACTIVE_STATUSES.has(s) ? "active" : "alert";

	return <AdminStatusBadge tone={tone}>{label}</AdminStatusBadge>;
}
