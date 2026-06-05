import Image from "next/image";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { YnsLink } from "@/ui/yns-link";

export default function ForbiddenPage() {
	return (
		<main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
			<div className="mx-auto mb-6 flex justify-center">
				<div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
					<Image
						src="/images/selolibertaria.png"
						alt="Selo Libertária"
						width={72}
						height={72}
						className="h-16 w-16 object-contain"
					/>
				</div>
			</div>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-3xl font-bold">Acesso negado</CardTitle>
				</CardHeader>
				<CardContent className="text-center space-y-4">
					<p className="text-muted-foreground">Você não tem permissão para visualizar esta página.</p>
					<div className="flex items-center justify-center gap-3">
						<Button asChild>
							<YnsLink href="/">Voltar para o início</YnsLink>
						</Button>
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
