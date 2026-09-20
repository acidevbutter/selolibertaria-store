"use client";

import { useState } from "react";
import { PresaleWizard } from "@/app/admin/pre-venda/_components/presale-wizard.client";
import {
	closePresaleAction,
	deletePresaleAction,
	getOrCreateLittleFishBigFishPresale,
	listPresaleReservationsAction,
	type PresaleRecord,
	type PresaleReservationRecord,
} from "@/app/admin/pre-venda/presale-actions";
import { formatBRL, formatShortDate } from "@/lib/presales";
import { AdminEditorialEmptyState, EditorialPanel } from "@/ui/editorial/editorial-primitives";

const primaryButtonStyle: React.CSSProperties = {
	height: 44,
	padding: "0 20px",
	background: "var(--ad-ink, #0B0B0B)",
	color: "#F7F4EF",
	border: "none",
	fontSize: 11,
	fontWeight: 900,
	letterSpacing: "0.22em",
	textTransform: "uppercase",
	cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
	height: 44,
	padding: "0 18px",
	background: "#FFFFFF",
	border: "1px solid rgba(11,11,11,0.3)",
	fontSize: 11,
	fontWeight: 900,
	letterSpacing: "0.22em",
	textTransform: "uppercase",
	cursor: "pointer",
};

const destructiveButtonStyle: React.CSSProperties = {
	...primaryButtonStyle,
	background: "var(--ad-wine, #7A1E22)",
};

const disabledButtonStyle: React.CSSProperties = {
	...secondaryButtonStyle,
	border: "1px solid rgba(11,11,11,0.12)",
	color: "rgba(11,11,11,0.35)",
	cursor: "default",
};

const STATUS_LABEL: Record<PresaleRecord["status"], string> = {
	rascunho: "Rascunho",
	no_ar: "No ar",
	encerrada: "Encerrada",
};

export function PresaleAdminScreen({
	initialPresales,
	canWrite,
}: {
	initialPresales: PresaleRecord[];
	canWrite: boolean;
}) {
	const [presales, setPresales] = useState(initialPresales);
	const [wizardPresale, setWizardPresale] = useState<PresaleRecord | null>(null);
	const [wizardStep, setWizardStep] = useState(1);
	const [loadingNew, setLoadingNew] = useState(false);

	async function refreshList() {
		// A publish/close/delete só existe pra little-fish-big-fish por enquanto;
		// re-lê o produto conhecido em vez de listar tudo de novo.
		const presale = await getOrCreateLittleFishBigFishPresale();
		setPresales(presale ? [presale] : []);
	}

	async function handleNovaPresale() {
		setLoadingNew(true);
		const presale = await getOrCreateLittleFishBigFishPresale();
		setLoadingNew(false);
		if (presale) {
			setWizardStep(1);
			setWizardPresale(presale);
		}
	}

	if (wizardPresale) {
		return (
			<EditorialPanel className="mt-5">
				<PresaleWizard
					presale={wizardPresale}
					initialStep={wizardStep}
					publishLabel={wizardPresale.published ? "Salvar alterações" : "Publicar pré-venda"}
					onPublished={async () => {
						setWizardPresale(null);
						await refreshList();
					}}
				/>
			</EditorialPanel>
		);
	}

	return (
		<EditorialPanel className="mt-5">
			<div className="mb-5 flex flex-wrap items-center justify-between gap-4">
				<p className="m-0 text-sm text-muted-foreground">
					{presales.length > 0
						? ""
						: "Nenhuma pré-venda ainda. A próxima abre quando você marcar uma data de estreia."}
				</p>
				{canWrite ? (
					<button
						type="button"
						onClick={() => void handleNovaPresale()}
						disabled={loadingNew}
						style={primaryButtonStyle}
					>
						{loadingNew ? "Preparando…" : "Nova pré-venda"}
					</button>
				) : null}
			</div>

			{presales.length === 0 ? (
				<AdminEditorialEmptyState
					title="Nenhuma pré-venda"
					description="Crie a pré-venda de little fish, big fish pra abrir reservas e o aviso no site."
				/>
			) : (
				<div className="border border-[color:var(--editorial-border)]">
					<div className="grid grid-cols-[minmax(0,2fr)_110px_110px_130px_130px] gap-3 border-b border-[color:var(--editorial-border)] bg-[color:var(--editorial-surface,#D8D0C4)] p-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
						<span>Produto</span>
						<span>Estado</span>
						<span>Reservas</span>
						<span>A cobrar</span>
						<span>Estreia</span>
					</div>
					{presales.map((presale) => (
						<PresaleRow
							key={presale.id}
							presale={presale}
							canWrite={canWrite}
							onEdit={(step) => {
								setWizardStep(step);
								setWizardPresale(presale);
							}}
							onChanged={refreshList}
						/>
					))}
				</div>
			)}
		</EditorialPanel>
	);
}

function PresaleRow({
	presale,
	canWrite,
	onEdit,
	onChanged,
}: {
	presale: PresaleRecord;
	canWrite: boolean;
	onEdit: (step: number) => void;
	onChanged: () => void | Promise<void>;
}) {
	const [open, setOpen] = useState(false);
	const [reservations, setReservations] = useState<PresaleReservationRecord[] | null>(null);
	const [loadingReservations, setLoadingReservations] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [closing, setClosing] = useState(false);
	const [deleting, setDeleting] = useState(false);

	async function toggle() {
		const next = !open;
		setOpen(next);
		if (next && reservations === null) {
			setLoadingReservations(true);
			setReservations(await listPresaleReservationsAction(presale.id));
			setLoadingReservations(false);
		}
	}

	async function handleClose() {
		if (
			!window.confirm("Encerrar esta pré-venda? As reservas continuam valendo, mas não é possível reabrir.")
		)
			return;
		setClosing(true);
		setActionError(null);
		const result = await closePresaleAction(presale.id);
		setClosing(false);
		if (!result.ok) {
			setActionError(result.message ?? "Não foi possível encerrar.");
			return;
		}
		await onChanged();
	}

	async function handleDelete() {
		if (!window.confirm("Apagar esta pré-venda? Essa ação não pode ser desfeita.")) return;
		setDeleting(true);
		setActionError(null);
		const result = await deletePresaleAction(presale.id);
		setDeleting(false);
		if (!result.ok) {
			setActionError(result.message ?? "Não foi possível apagar.");
			return;
		}
		await onChanged();
	}

	const cobrado = reservations?.filter((r) => r.chargeStatus === "cobrado").length ?? null;
	const falhou = reservations?.filter((r) => r.chargeStatus === "falhou").length ?? null;

	return (
		<div className="border-b border-[color:var(--editorial-border)]">
			<button
				type="button"
				onClick={() => void toggle()}
				className="grid w-full grid-cols-[minmax(0,2fr)_110px_110px_130px_130px] items-center gap-3 p-4 text-left"
			>
				<span className="text-base font-black">little fish, big fish</span>
				<span
					className="inline-flex h-6 w-fit items-center px-2.5 text-[10px] font-black uppercase tracking-[0.2em]"
					style={{
						background: presale.status === "no_ar" ? "#0B0B0B" : "rgba(11,11,11,0.12)",
						color: presale.status === "no_ar" ? "#F7F4EF" : "#0B0B0B",
					}}
				>
					{STATUS_LABEL[presale.status]}
				</span>
				<span>{presale.reservationsCount}</span>
				<span className="text-[color:var(--ad-wine,#7A1E22)]">{formatBRL(presale.amountToCharge)}</span>
				<span>{formatShortDate(presale.launchAt)}</span>
			</button>

			{open ? (
				<div className="flex flex-col gap-4 border-t border-[color:var(--editorial-border)] p-4">
					<div className="flex flex-wrap gap-9">
						<Stat label="reservado" value={String(presale.reservationsCount)} />
						<Stat label="cartão a confirmar" value={loadingReservations ? "…" : String(falhou ?? 0)} accent />
						<Stat label="cobrado" value={loadingReservations ? "…" : String(cobrado ?? 0)} />
						<Stat label="preço de pré-venda" value={formatBRL(presale.presalePrice)} />
					</div>
					{presale.reservationsCount > 0 ? (
						<div
							className="p-4 text-sm leading-7"
							style={{
								border: "1px solid var(--ad-wine-line, rgba(122,30,34,0.4))",
								background: "var(--ad-wine-wash, rgba(122,30,34,0.06))",
								color: "var(--ad-wine, #7A1E22)",
							}}
						>
							Esta pré-venda tem {presale.reservationsCount} reserva(s) — por isso ela e o produto{" "}
							<strong>little fish, big fish</strong> não podem ser apagados. Para tirar do ar sem prejudicar
							quem reservou, use <strong>Encerrar pré-venda</strong>.
						</div>
					) : null}
					{actionError ? <p className="text-sm text-[color:var(--ad-wine,#7A1E22)]">{actionError}</p> : null}
					<div className="flex flex-wrap gap-2.5">
						<button type="button" style={secondaryButtonStyle} onClick={() => void toggle()}>
							Ver reservas
						</button>
						{canWrite ? (
							<button type="button" style={secondaryButtonStyle} onClick={() => onEdit(3)}>
								Editar aviso
							</button>
						) : null}
						{canWrite && presale.status !== "encerrada" ? (
							<button
								type="button"
								style={destructiveButtonStyle}
								disabled={closing}
								onClick={() => void handleClose()}
							>
								{closing ? "Encerrando…" : "Encerrar pré-venda"}
							</button>
						) : null}
						{canWrite ? (
							presale.reservationsCount > 0 ? (
								<span style={disabledButtonStyle} title="Existem reservas — encerre em vez de apagar.">
									Apagar · indisponível
								</span>
							) : (
								<button
									type="button"
									style={secondaryButtonStyle}
									disabled={deleting}
									onClick={() => void handleDelete()}
								>
									{deleting ? "Apagando…" : "Apagar"}
								</button>
							)
						) : null}
					</div>
				</div>
			) : null}
		</div>
	);
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
			<span className="text-xl font-black" style={{ color: accent ? "var(--ad-wine, #7A1E22)" : "inherit" }}>
				{value}
			</span>
		</div>
	);
}
