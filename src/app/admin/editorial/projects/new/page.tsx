import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialProjectForm } from "@/app/admin/editorial/_components/editorial-project-form";
import { createEditorialProjectAction } from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialNote,
	AdminEditorialPage,
} from "@/ui/editorial/editorial-primitives";

export default async function NewEditorialProjectPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");
	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Novo projeto"
				description="Abra uma nova frente cultural com contexto editorial, periodo, local e imagem principal."
				actions={
					<Link
						href="/admin/editorial/projects"
						className="inline-flex items-center gap-2 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
					>
						<ArrowLeft className="h-4 w-4" />
						Voltar para projetos
					</Link>
				}
			/>
			<AdminEditorialNote
				title="Fluxo"
				description="Preencha identidade, narrativa e publicação. O projeto retorna para a coleção já pronto para ordenação e revisão."
			/>
			<EditorialProjectForm action={createEditorialProjectAction} submitLabel="Criar projeto" />
		</AdminEditorialPage>
	);
}
