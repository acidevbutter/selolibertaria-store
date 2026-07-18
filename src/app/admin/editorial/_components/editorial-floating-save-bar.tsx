"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/ui/shadcn/button";

export function EditorialFloatingSaveBar({
	children,
	hint = "Salvar alterações desta página.",
}: {
	children: ReactNode;
	hint?: string;
}) {
	const { pending } = useFormStatus();

	return (
		<div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end">
			<div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 border border-[color:rgba(247,244,239,0.16)] bg-[color:rgba(11,11,11,0.94)] px-4 py-3 text-[color:var(--editorial-paper)] shadow-[0_16px_40px_rgba(11,11,11,0.24)] backdrop-blur md:w-auto md:min-w-[20rem] md:justify-between">
				<p className="hidden text-xs leading-5 text-[color:rgba(247,244,239,0.72)] md:block">
					{pending ? "Aguarde enquanto o conteudo e salvo." : hint}
				</p>
				<Button
					type="submit"
					disabled={pending}
					className="w-full rounded-none bg-[color:var(--editorial-paper)] px-5 text-[color:var(--editorial-ink)] hover:bg-[color:var(--editorial-beige)] md:w-auto"
				>
					{pending ? "Salvando..." : children}
				</Button>
			</div>
		</div>
	);
}
