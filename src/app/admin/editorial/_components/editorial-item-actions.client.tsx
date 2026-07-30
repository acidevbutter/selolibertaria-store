"use client";

import type { FormEvent } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/ui/shadcn/button";

type ActionState = {
	status: "idle" | "success" | "error";
	message: string | null;
};

type EditorialItemAction = (formData: FormData) => void | Promise<void>;

const INITIAL_STATE: ActionState = { status: "idle", message: null };

function SubmitButton({
	children,
	variant = "outline",
}: {
	children: string;
	variant?: "outline" | "destructive";
}) {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" variant={variant} className="w-full" disabled={pending}>
			{pending ? "Processando..." : children}
		</Button>
	);
}

function getErrorMessage(error: unknown) {
	if (error instanceof Error && error.message) return error.message;
	return "Não foi possível concluir esta ação. Tente novamente.";
}

function isNavigationError(error: unknown) {
	return (
		typeof error === "object" &&
		error !== null &&
		"digest" in error &&
		typeof error.digest === "string" &&
		error.digest.startsWith("NEXT_")
	);
}

export function EditorialItemActions({
	slug,
	published,
	itemLabel,
	toggleAction,
	deleteAction,
}: {
	slug: string;
	published: boolean;
	itemLabel: "evento" | "projeto";
	toggleAction: EditorialItemAction;
	deleteAction: EditorialItemAction;
}) {
	const [state, formAction] = useActionState(async (_previous: ActionState, formData: FormData) => {
		try {
			await toggleAction(formData);
			return {
				status: "success" as const,
				message: published ? "Movido para rascunho com sucesso." : "Publicado com sucesso.",
			};
		} catch (error) {
			if (isNavigationError(error)) throw error;
			return { status: "error" as const, message: getErrorMessage(error) };
		}
	}, INITIAL_STATE);

	function confirmDeletion(event: FormEvent<HTMLFormElement>) {
		if (!window.confirm(`Excluir este ${itemLabel}? Esta ação não pode ser desfeita.`)) {
			event.preventDefault();
		}
	}

	return (
		<div className="space-y-3">
			<form action={formAction}>
				<input type="hidden" name="slug" value={slug} />
				<input type="hidden" name="published" value={published ? "false" : "true"} />
				<SubmitButton>{published ? "Mover para rascunho" : "Publicar"}</SubmitButton>
			</form>
			<form action={deleteAction} onSubmit={confirmDeletion}>
				<input type="hidden" name="slug" value={slug} />
				<SubmitButton variant="destructive">{`Excluir ${itemLabel}`}</SubmitButton>
			</form>
			{state.status === "success" && state.message ? (
				<p role="status" className="text-sm text-emerald-700">
					{state.message}
				</p>
			) : null}
			{state.status === "error" && state.message ? (
				<p role="alert" className="text-sm text-destructive">
					{state.message}
				</p>
			) : null}
		</div>
	);
}
