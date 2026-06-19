"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
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
				const text = await res.text();
				throw new Error(text || "Failed");
			}
			setOk(true);
			startTransition(() => {
				router.refresh();
			});
		} catch (e) {
			const message = e instanceof Error ? e.message : "Failed";
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
					<label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</label>
					<Select value={status} onValueChange={(v) => setStatus(v as FulfillmentStatus)}>
						<SelectTrigger className="w-full rounded-none border-[color:var(--editorial-border)] bg-white">
							<SelectValue placeholder="Selecionar status" />
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
				<div className="grid gap-1">
					<label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
						Código de rastreio
					</label>
					<Input
						value={tracking}
						onChange={(e) => setTracking(e.target.value)}
						placeholder="Ex.: BR123456789"
						className="rounded-none border-[color:var(--editorial-border)] bg-white"
					/>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Button
					size="sm"
					onClick={save}
					disabled={saving}
					className="rounded-none bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]"
				>
					{saving ? "Salvando..." : "Salvar expedição"}
				</Button>
				{ok && <span className="text-xs text-emerald-700">Salvo</span>}
				{error && <span className="text-xs text-destructive">{error}</span>}
			</div>
		</div>
	);
}
