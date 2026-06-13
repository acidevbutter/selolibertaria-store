import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialProjectForm } from "@/app/admin/editorial/_components/editorial-project-form";
import { createEditorialProjectAction } from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";

export default async function NewEditorialProjectPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");
	return (
		<main className="mx-auto max-w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<div className="space-y-3">
				<Link
					href="/admin/editorial/projects"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Editorial
				</Link>
				<div>
					<h1 className="text-2xl font-semibold">Novo projeto</h1>
				</div>
			</div>
			<EditorialProjectForm action={createEditorialProjectAction} submitLabel="Criar projeto" />
		</main>
	);
}
