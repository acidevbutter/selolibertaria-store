import { EditorialShell } from "@/ui/editorial/editorial-primitives";
import { Skeleton } from "@/ui/shadcn/skeleton";

export default function ProductsLoading() {
	return (
		<main>
			<section className="bg-[color:var(--editorial-paper)]">
				<EditorialShell className="grid gap-8 py-12 lg:grid-cols-[minmax(0,1.1fr)_320px] lg:items-center lg:py-16">
					<div className="space-y-4">
						<Skeleton className="h-4 w-24 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
						<Skeleton className="h-16 w-full max-w-3xl rounded-none bg-[color:rgba(11,11,11,0.08)]" />
						<Skeleton className="h-24 w-full max-w-2xl rounded-none bg-[color:rgba(11,11,11,0.08)]" />
					</div>
					<Skeleton className="aspect-[0.74] w-full rounded-none bg-[color:rgba(11,11,11,0.08)]" />
				</EditorialShell>
			</section>

			<EditorialShell className="space-y-6 py-8">
				<Skeleton className="h-8 w-48 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, index) => (
						<div
							key={index}
							className="space-y-4 border border-[color:var(--editorial-border)] bg-[color:rgba(247,244,239,0.45)] p-4"
						>
							<Skeleton className="aspect-[0.84] w-full rounded-none bg-[color:rgba(11,11,11,0.08)]" />
							<Skeleton className="h-8 w-3/4 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
							<Skeleton className="h-20 w-full rounded-none bg-[color:rgba(11,11,11,0.08)]" />
							<Skeleton className="h-10 w-32 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
						</div>
					))}
				</div>
			</EditorialShell>
		</main>
	);
}
