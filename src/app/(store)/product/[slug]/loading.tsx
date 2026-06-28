import { EditorialShell } from "@/ui/editorial/editorial-primitives";
import { Skeleton } from "@/ui/shadcn/skeleton";

export default function ProductLoading() {
	return (
		<article>
			<section className="bg-[color:var(--editorial-paper)]">
				<EditorialShell className="grid gap-10 py-12 lg:grid-cols-[430px_minmax(0,1fr)] lg:items-start lg:gap-20 lg:py-16">
					<Skeleton className="aspect-square w-full rounded-none bg-[color:rgba(11,11,11,0.08)]" />
					<div className="space-y-6">
						<Skeleton className="h-4 w-20 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
						<Skeleton className="h-20 w-full max-w-xl rounded-none bg-[color:rgba(11,11,11,0.08)]" />
						<Skeleton className="h-10 w-32 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
						<Skeleton className="h-12 w-64 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
						<Skeleton className="h-32 w-full rounded-none bg-[color:rgba(11,11,11,0.08)]" />
					</div>
				</EditorialShell>
			</section>

			<EditorialShell className="grid gap-10 py-12 lg:grid-cols-[1fr_0.95fr] lg:py-16">
				<div className="space-y-4">
					<Skeleton className="h-6 w-32 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
					<Skeleton className="h-56 w-full rounded-none bg-[color:rgba(11,11,11,0.08)]" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-6 w-32 rounded-none bg-[color:rgba(11,11,11,0.08)]" />
					<Skeleton className="h-56 w-full rounded-none bg-[color:rgba(11,11,11,0.08)]" />
				</div>
			</EditorialShell>
		</article>
	);
}
