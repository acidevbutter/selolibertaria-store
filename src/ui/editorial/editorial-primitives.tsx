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

export function AdminEditorialPage({ children, className }: { children: ReactNode; className?: string }) {
	return <main className={cn("w-full space-y-8", className)}>{children}</main>;
}

export function AdminEditorialHero({
	eyebrow,
	title,
	description,
	actions,
	aside,
	className,
}: {
	eyebrow?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	aside?: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)] p-6 sm:p-8",
				className,
			)}
		>
			<div className={cn("grid gap-8", aside ? "xl:grid-cols-[minmax(0,1.5fr)_320px]" : undefined)}>
				<div className="space-y-5">
					<div className="space-y-3">
						{eyebrow ? (
							<EditorialEyebrow className="text-[color:var(--editorial-accent)]">{eyebrow}</EditorialEyebrow>
						) : null}
						<h1 className="display-font max-w-4xl text-[2.6rem] font-black leading-[0.9] tracking-[-0.05em] text-[color:var(--editorial-ink)] sm:text-[4rem]">
							{title}
						</h1>
						{description ? (
							<p className="max-w-3xl text-sm leading-7 text-[color:var(--editorial-muted)] sm:text-base">
								{description}
							</p>
						) : null}
					</div>
					{actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
				</div>
				{aside ? <div>{aside}</div> : null}
			</div>
		</section>
	);
}

export function AdminEditorialStat({
	label,
	value,
	helper,
	className,
}: {
	label: ReactNode;
	value: ReactNode;
	helper?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-5", className)}>
			<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
				{label}
			</div>
			<div className="mt-4 text-[1.65rem] font-semibold tracking-[-0.04em] text-[color:var(--editorial-ink)] sm:text-[1.9rem]">
				{value}
			</div>
			{helper ? (
				<div className="mt-3 text-sm leading-6 text-[color:var(--editorial-muted)]">{helper}</div>
			) : null}
		</div>
	);
}

export function AdminEditorialNote({
	title,
	description,
	className,
}: {
	title: ReactNode;
	description: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-5 text-[color:var(--editorial-ink)]",
				className,
			)}
		>
			<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
				{title}
			</div>
			<div className="mt-3 text-sm leading-6 text-[color:var(--editorial-muted)]">{description}</div>
		</div>
	);
}

export function AdminEditorialEmptyState({
	title,
	description,
	className,
}: {
	title: ReactNode;
	description: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"border border-dashed border-[color:var(--editorial-border)] bg-[#fbf7f1] px-6 py-10 text-center",
				className,
			)}
		>
			<div className="space-y-2">
				<div className="text-base font-semibold text-[color:var(--editorial-ink)]">{title}</div>
				<div className="mx-auto max-w-2xl text-sm leading-6 text-[color:var(--editorial-muted)]">
					{description}
				</div>
			</div>
		</div>
	);
}
