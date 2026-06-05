import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialHomeForm } from "@/app/admin/editorial/_components/editorial-home-form";
import { EditorialMetaCard } from "@/app/admin/editorial/_components/editorial-meta-card";
import { getEditorialHomeRecord, updateEditorialHomeAction } from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { getMockEditorialHomePage } from "@/lib/editorial-content-mock";

export const dynamic = "force-dynamic";

export default async function AdminEditorialHomePage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");

	const page = (await getEditorialHomeRecord()) ?? getMockEditorialHomePage();

	return (
		<main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<div className="space-y-3">
				<Link
					href="/admin/editorial"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Editorial
				</Link>
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold">Editorial · Home</h1>
					<p className="text-sm text-muted-foreground">
						Edite os blocos institucionais principais da home sem mexer no catálogo ou na agenda dinâmica.
					</p>
				</div>
			</div>
			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<EditorialHomeForm action={updateEditorialHomeAction} page={page} submitLabel="Salvar página" />
				<EditorialMetaCard
					published={page.published}
					order={page.order}
					updatedAt={page.updatedAt}
					updatedBy={page.updatedBy}
				/>
			</div>
		</main>
	);
}
