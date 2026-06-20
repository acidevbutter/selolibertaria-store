import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialEventForm } from "@/app/admin/editorial/_components/editorial-event-form";
import { createEditorialEventAction } from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialNote,
	AdminEditorialPage,
} from "@/ui/editorial/editorial-primitives";

export const dynamic = "force-dynamic";

export default async function NewEditorialEventPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Novo evento"
				description="Crie um evento com leitura curta, agenda, ordem editorial e imagem principal sem sair do fluxo do hub."
				actions={
					<Link
						href="/admin/editorial/events"
						className="inline-flex items-center gap-2 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
					>
						<ArrowLeft className="h-4 w-4" />
						Voltar para eventos
					</Link>
				}
			/>
			<AdminEditorialNote
				title="Fluxo"
				description="Preencha identidade, agenda, imagem e publicação. Ao salvar, o evento volta para a coleção com ordem e status prontos para revisão."
			/>
			<EditorialEventForm action={createEditorialEventAction} submitLabel="Criar evento" />
		</AdminEditorialPage>
	);
}
