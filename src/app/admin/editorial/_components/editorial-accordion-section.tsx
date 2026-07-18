"use client";

import type { InvalidEvent, ReactNode } from "react";
import { useRef } from "react";

import { Card, CardContent, CardTitle } from "@/ui/shadcn/card";

export function EditorialAccordionSection({
	title,
	description,
	children,
	defaultOpen = false,
	contentClassName = "grid gap-4 px-5 py-5",
}: {
	title: string;
	description?: string;
	children: ReactNode;
	defaultOpen?: boolean;
	contentClassName?: string;
}) {
	const detailsRef = useRef<HTMLDetailsElement>(null);

	function handleInvalid(event: InvalidEvent<HTMLDetailsElement>) {
		detailsRef.current?.setAttribute("open", "");
		event.stopPropagation();
	}

	return (
		<Card className="rounded-none border-[color:var(--editorial-border)] p-0">
			<details ref={detailsRef} open={defaultOpen} onInvalidCapture={handleInvalid} className="group">
				<summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[color:var(--editorial-accent)]">
					<div className="space-y-2">
						<CardTitle className="text-base text-[color:var(--editorial-ink)]">{title}</CardTitle>
						{description ? (
							<p className="max-w-2xl text-sm leading-6 text-[color:var(--editorial-muted)]">{description}</p>
						) : null}
					</div>
					<span className="shrink-0 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-muted)] group-open:hidden">
						Expandir
					</span>
					<span className="hidden shrink-0 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-muted)] group-open:block">
						Recolher
					</span>
				</summary>
				<CardContent className={`border-t border-[color:var(--editorial-border)] ${contentClassName}`}>
					{children}
				</CardContent>
			</details>
		</Card>
	);
}
