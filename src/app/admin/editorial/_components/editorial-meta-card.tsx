import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";

function formatDate(value?: string) {
	if (!value) return "Ainda não registrado";
	try {
		return new Intl.DateTimeFormat("pt-BR", {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(new Date(value));
	} catch {
		return value;
	}
}

export function EditorialMetaCard({
	published,
	order,
	updatedAt,
	updatedBy,
}: {
	published: boolean;
	order: number;
	updatedAt?: string;
	updatedBy?: string | null;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Resumo operacional</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				<div className="rounded-lg border p-4">
					<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Publicação</p>
					<p className="mt-2 font-medium">{published ? "Publicado" : "Rascunho"}</p>
				</div>
				<div className="rounded-lg border p-4">
					<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ordem</p>
					<p className="mt-2 font-medium">{order}</p>
				</div>
				<div className="rounded-lg border p-4">
					<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Última atualização</p>
					<p className="mt-2 font-medium">{formatDate(updatedAt)}</p>
					<p className="mt-1 text-muted-foreground">{updatedBy || "Sistema"}</p>
				</div>
			</CardContent>
		</Card>
	);
}
