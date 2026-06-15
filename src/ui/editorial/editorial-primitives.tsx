import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EditorialShell({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function EditorialSection({ children, className }: { children: ReactNode; className?: string }) {
	return <section className={cn("space-y-6", className)}>{children}</section>;
}

export function EditorialPanel({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<div
			className={cn(
				"border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)] p-6 shadow-none sm:p-8",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function EditorialDarkPanel({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<div
			className={cn(
				"border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-ink)] p-6 text-[color:var(--editorial-paper)] shadow-none sm:p-8",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function EditorialEyebrow({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<p
			className={cn(
				"text-[11px] font-medium uppercase tracking-[0.32em] text-[color:var(--editorial-muted)]",
				className,
			)}
		>
			{children}
		</p>
	);
}
