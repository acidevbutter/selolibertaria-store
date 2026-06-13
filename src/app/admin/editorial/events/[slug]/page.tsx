import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialEventForm } from "@/app/admin/editorial/_components/editorial-event-form";
import { EditorialMetaCard } from "@/app/admin/editorial/_components/editorial-meta-card";
import {
	deleteEditorialEventAction,
	getEditorialEventBySlug,
	toggleEditorialEventPublishedAction,
	updateEditorialEventAction,
} from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";

export const dynamic = "force-dynamic";

export default async function AdminEditorialEventDetailsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");

	const { slug: rawSlug } = await params;
	const slug = decodeURIComponent(rawSlug);
	const event = await getEditorialEventBySlug(slug);
	if (!event) redirect("/admin/editorial/events");

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
					<h1 className="text-2xl font-semibold">{event.title}</h1>
					<p className="text-sm text-muted-foreground">{event.slug}</p>
				</div>
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<EditorialEventForm action={updateEditorialEventAction} event={event} submitLabel="Salvar evento" />

				<div className="space-y-6">
					<EditorialMetaCard
						published={event.published}
						order={event.order}
						updatedAt={event.updatedAt}
						updatedBy={event.updatedBy}
					/>
					<Card>
						<CardHeader>
							<CardTitle>Ações</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<form action={toggleEditorialEventPublishedAction}>
								<input type="hidden" name="slug" value={event.slug} />
								<input type="hidden" name="published" value={event.published ? "false" : "true"} />
								<Button type="submit" variant="outline" className="w-full">
									{event.published ? "Mover para rascunho" : "Publicar"}
								</Button>
							</form>
							<form action={deleteEditorialEventAction}>
								<input type="hidden" name="slug" value={event.slug} />
								<Button type="submit" variant="destructive" className="w-full">
									Excluir evento
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	);
}
