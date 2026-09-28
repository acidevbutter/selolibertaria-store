"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteSavedCard } from "@/actions/saved-cards-actions";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "@/i18n/client";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/ui/shadcn/dialog";

export interface SavedCardItem {
	id: string;
	provider: string;
	brand: string | null;
	last4: string | null;
	createdAt: string;
}

export function SavedCardsList({ cards: initialCards }: { cards: SavedCardItem[] }) {
	const t = useTranslations("Account.paymentMethods");
	const locale = useLocale();
	const [cards, setCards] = useState(initialCards);
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [confirmId, setConfirmId] = useState<string | null>(null);

	function formatDate(value: string) {
		try {
			return new Intl.DateTimeFormat(locale, {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}).format(new Date(value));
		} catch {
			return value;
		}
	}

	async function confirmDelete() {
		const id = confirmId;
		if (!id) return;
		setConfirmId(null);
		setPendingId(id);
		const result = await deleteSavedCard(id);
		setPendingId(null);
		if ("error" in result) {
			toast.error(t("toast.deleteError"));
			return;
		}
		setCards((prev) => prev.filter((card) => card.id !== id));
		toast.success(t("toast.deleted"));
	}

	if (cards.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-10 text-center">
				<p className="text-sm text-muted-foreground">{t("empty")}</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{cards.map((card) => (
					<div key={card.id} className="space-y-3 rounded-xl border bg-card p-4">
						<p className="font-semibold tracking-tight">
							{(card.brand || t("unknownBrand")).toUpperCase()} •••• {card.last4 ?? "----"}
						</p>
						<p className="text-xs text-muted-foreground">
							{t("savedAt", { date: formatDate(card.createdAt) })}
						</p>
						<Button
							variant="outline"
							size="sm"
							disabled={pendingId === card.id}
							onClick={() => setConfirmId(card.id)}
						>
							{pendingId === card.id ? t("actions.deleting") : t("actions.delete")}
						</Button>
					</div>
				))}
			</div>
			<Dialog open={confirmId !== null} onOpenChange={(open) => !open && setConfirmId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("confirmDelete.title")}</DialogTitle>
						<DialogDescription>{t("confirmDelete.description")}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirmId(null)}>
							{t("confirmDelete.cancel")}
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							{t("confirmDelete.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
