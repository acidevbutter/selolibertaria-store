import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialContactForm } from "@/app/admin/editorial/_components/editorial-contact-form";
import { EditorialMetaCard } from "@/app/admin/editorial/_components/editorial-meta-card";
import { getEditorialContactRecord, updateEditorialContactAction } from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function AdminEditorialContactPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");

	const page = await getEditorialContactRecord();
	if (!page) redirect("/admin/editorial");

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
					<h1 className="text-2xl font-semibold">Editorial · Contato</h1>
					<p className="text-sm text-muted-foreground">
						Edite a página de contato e seus caminhos públicos sem depender de texto fixo no código.
					</p>
				</div>
			</div>
			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<EditorialContactForm action={updateEditorialContactAction} page={page} submitLabel="Salvar página" />
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
