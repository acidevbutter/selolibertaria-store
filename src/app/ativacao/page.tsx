import { redirect } from "next/navigation";
import { getOrCreateLittleFishBigFishPresale } from "@/app/admin/pre-venda/presale-actions";
import { AtivacaoWizard } from "@/app/ativacao/_components/ativacao-wizard.client";
import { getSiteActivationForAdmin } from "@/app/ativacao/activation-actions";
import { auth } from "@/lib/auth";
import { normalizeUserRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

function WaitingScreen({ message }: { message: string }) {
	return (
		<main
			style={{
				display: "flex",
				minHeight: "100dvh",
				alignItems: "center",
				justifyContent: "center",
				padding: "24px",
				textAlign: "center",
			}}
		>
			<div style={{ maxWidth: 420 }}>
				<h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Site ainda não lançado</h1>
				<p style={{ color: "var(--ad-text-muted)" }}>{message}</p>
			</div>
		</main>
	);
}

export default async function AtivacaoPage() {
	const session = await auth();
	if (!session) redirect("/login");

	const activation = await getSiteActivationForAdmin();
	if (activation?.activated) redirect("/admin");

	const role = normalizeUserRole(session.user.role);
	if (role !== "admin") {
		return (
			<WaitingScreen message="Aguardando o administrador concluir a ativação do site. Volte mais tarde." />
		);
	}

	const presale = await getOrCreateLittleFishBigFishPresale();
	if (!presale) {
		return (
			<WaitingScreen message="Não foi possível preparar a pré-venda de little fish, big fish. Verifique se o produto existe no catálogo." />
		);
	}

	return <AtivacaoWizard presale={presale} />;
}
