"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Field } from "@/app/admin/_components/ui/Field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

type FulfillmentStatus = "received" | "producing" | "shipped";

export default function UpdateFulfillment({
	id,
	current,
	statuses,
}: {
	id: string;
	current?: { status?: FulfillmentStatus; trackingNumber?: string | null };
	statuses: FulfillmentStatus[];
}) {
	const router = useRouter();
	const [status, setStatus] = useState<FulfillmentStatus | "">(current?.status || "");
	const [tracking, setTracking] = useState<string>(current?.trackingNumber || "");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [ok, setOk] = useState(false);

	async function save() {
		setSaving(true);
		setError(null);
		setOk(false);
		try {
			const res = await fetch(`/api/admin/orders/${id}/fulfillment`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					status: status || undefined,
					trackingNumber: tracking.length ? tracking : null,
				}),
			});
			if (!res.ok) {
				const payload = (await res.json().catch(() => null)) as { error?: string } | null;
				throw new Error(payload?.error || "Não foi possível salvar a expedição.");
			}
			setOk(true);
			startTransition(() => {
				router.refresh();
			});
		} catch (e) {
			const message = e instanceof Error ? e.message : "Não foi possível salvar a expedição.";
			setError(message);
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="grid gap-3">
			<div className="text-sm font-medium">Expedição</div>
			<div className="grid gap-2 sm:grid-cols-2">
				<div className="grid gap-1">
					<label className="sl-lbl">Status</label>
					<Select value={status} onValueChange={(v) => setStatus(v as FulfillmentStatus)}>
						<SelectTrigger
							className="w-full border-[var(--sl-line)] bg-[var(--sl-paper-pure)]"
							style={{ borderRadius: "var(--sl-radius)" }}
						>
							<SelectValue placeholder="Escolha o status" />
						</SelectTrigger>
						<SelectContent>
							{statuses.map((s) => (
								<SelectItem key={s} value={s}>
									{s === "received" ? "Recebido" : s === "producing" ? "Produção" : "Enviado"}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Field
					label="Código de rastreio"
					value={tracking}
					onChange={(e) => setTracking(e.target.value)}
					placeholder="Ex.: BR123456789"
				/>
			</div>
			<div className="flex items-center gap-2">
				<button type="button" className="ad-btn ad-pri" onClick={save} disabled={saving}>
					{saving ? "Salvando..." : "Salvar expedição"}
				</button>
				{ok && <span className="text-xs text-[var(--sl-wine)]">Expedição salva</span>}
				{error && <span className="text-xs text-[var(--sl-danger)]">{error}</span>}
			</div>
		</div>
	);
}
