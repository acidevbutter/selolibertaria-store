import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialEventForm } from "@/app/admin/editorial/_components/editorial-event-form";
import { EditorialItemActions } from "@/app/admin/editorial/_components/editorial-item-actions.client";
import { EditorialLivePreview } from "@/app/admin/editorial/_components/editorial-live-preview.client";
import { EditorialMetaCard } from "@/app/admin/editorial/_components/editorial-meta-card";
import { EditorialPagePreview } from "@/app/admin/editorial/_components/editorial-page-preview.client";
import {
	deleteEditorialEventAction,
	getEditorialEventBySlug,
	toggleEditorialEventPublishedAction,
	updateEditorialEventAction,
} from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
} from "@/ui/editorial/editorial-primitives";
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
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title={event.title}
				description="Edite agenda, imagem, status e publicação do evento."
				actions={
					<div className="flex flex-wrap gap-3">
						<EditorialPagePreview
							href="/events"
							published={event.published}
							formId="editorial-event-form"
							pageTitle={event.title}
						/>
						<Link
							href="/admin/editorial/events"
							className="inline-flex items-center gap-2 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar para eventos
						</Link>
						<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3">
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
								Slug
							</div>
							<div className="mt-2 font-mono text-xs text-[color:var(--editorial-muted)]">{event.slug}</div>
						</div>
					</div>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Status"
					value={event.status || "Não informado"}
					helper="Como o evento aparece no site."
				/>
				<AdminEditorialStat
					label="Período"
					value={event.period || "Não informado"}
					helper="Faixa ou agenda principal do evento."
				/>
				<AdminEditorialStat
					label="Publicação"
					value={event.published ? "Publicado" : "Rascunho"}
					helper="Estado atual no site."
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<EditorialEventForm action={updateEditorialEventAction} event={event} submitLabel="Salvar evento" />

				<div className="space-y-6">
					<EditorialLivePreview
						formId="editorial-event-form"
						pageTitle={event.title}
						published={event.published}
					/>
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
							<EditorialItemActions
								slug={event.slug}
								published={event.published}
								itemLabel="evento"
								toggleAction={toggleEditorialEventPublishedAction}
								deleteAction={deleteEditorialEventAction}
							/>
						</CardContent>
					</Card>
				</div>
			</div>
		</AdminEditorialPage>
	);
}
