import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialEventForm } from "@/app/admin/editorial/_components/editorial-event-form";
import { createEditorialEventAction } from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function NewEditorialEventPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");

	return (
		<main className="mx-auto max-w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<div className="space-y-3">
				<Link
					href="/admin/editorial/events"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Editorial
				</Link>
				<div>
					<h1 className="text-2xl font-semibold">Novo evento</h1>
					<p className="text-sm text-muted-foreground">
						Crie um evento editorial com texto, status, ordem e imagem principal.
					</p>
				</div>
			</div>

			<EditorialEventForm action={createEditorialEventAction} submitLabel="Criar evento" />
		</main>
	);
}
