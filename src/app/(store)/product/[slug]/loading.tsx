import { Skeleton } from "@/ui/shadcn/skeleton";

export default function ProductLoading() {
	return (
		<div className="sl-scope" style={{ background: "var(--sl-surface-page)" }}>
			<div className="mx-auto flex w-full max-w-[var(--sl-w-narrow)] flex-col gap-7 px-4 py-8 sm:px-8 lg:px-10 lg:py-12">
				<Skeleton className="h-4 w-64 rounded-none bg-[color:rgba(11,11,11,0.08)]" />

				<div className="grid items-start gap-10 lg:grid-cols-[1fr_420px]">
					<div className="flex flex-col gap-5">
						<div className="p-3" style={{ border: "1px solid var(--sl-ink)", background: "var(--sl-sand)" }}>
							<Skeleton className="aspect-square w-full rounded-none bg-[color:rgba(11,11,11,0.12)]" />
						</div>
						<div
							className="flex flex-col gap-3 pt-6"
							style={{ borderTop: "1px solid var(--sl-line-hairline)" }}
						>
							<Skeleton className="h-6 w-40 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
							<Skeleton className="h-24 w-full max-w-[60ch] rounded-none bg-[color:rgba(11,11,11,0.08)]" />
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-5 p-7" style={{ background: "var(--sl-surface-invert)" }}>
							<Skeleton className="h-3 w-24 rounded-none bg-[color:rgba(247,244,239,0.16)]" />
							<Skeleton className="h-10 w-full rounded-none bg-[color:rgba(247,244,239,0.16)]" />
							<Skeleton className="h-8 w-32 rounded-none bg-[color:rgba(247,244,239,0.16)]" />
							<Skeleton className="h-14 w-full rounded-none bg-[color:rgba(247,244,239,0.16)]" />
							<Skeleton className="h-14 w-full rounded-none bg-[color:rgba(247,244,239,0.16)]" />
						</div>
						<Skeleton className="h-32 w-full rounded-none bg-[color:rgba(11,11,11,0.08)]" />
					</div>
				</div>
			</div>
		</div>
	);
}
