import { Skeleton } from "@/ui/shadcn/skeleton";

export default function ProductsLoading() {
	return (
		<div className="sl-scope" style={{ background: "var(--sl-surface-page)" }}>
			<div className="mx-auto w-full max-w-[var(--sl-w-narrow)] px-4 py-16 sm:px-8 lg:px-12">
				<div className="flex flex-col gap-4">
					<Skeleton className="h-3 w-24 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
					<Skeleton className="h-14 w-full max-w-xl rounded-none bg-[color:rgba(11,11,11,0.08)]" />
					<Skeleton className="h-6 w-full max-w-2xl rounded-none bg-[color:rgba(11,11,11,0.08)]" />
				</div>
			</div>

			<div className="mx-auto w-full max-w-[var(--sl-w-narrow)] space-y-6 px-4 pb-16 sm:px-8 lg:px-12">
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, index) => (
						<div
							key={index}
							className="space-y-4 p-4"
							style={{
								border: "1px solid var(--sl-line-hairline)",
								background: "var(--sl-surface-card)",
								borderRadius: "var(--sl-radius)",
							}}
						>
							<Skeleton className="aspect-square w-full rounded-none bg-[color:rgba(11,11,11,0.08)]" />
							<Skeleton className="h-6 w-3/4 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
							<Skeleton className="h-4 w-1/2 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
