"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
	type PresaleRecord,
	publishPresaleAction,
	savePresaleDraftAction,
} from "@/app/admin/pre-venda/presale-actions";
import { formatBRL, formatLongDate, presaleDiscountPercent } from "@/lib/presales";
import { PresaleCardPreview } from "@/ui/pre-venda/presale-card-preview";
import { PresaleModalContent } from "@/ui/pre-venda/presale-modal-content";
import { SlCheckoutStepper } from "@/ui/sl/sl-checkout-stepper";

const STEPS = ["Quando estreia", "Quanto custa", "Como aparece", "Revisar e publicar"];
const AUTOSAVE_DELAY_MS = 3000;
const DISCOUNT_SHORTCUTS = [10, 20, 25];
const INTERVAL_OPTIONS = [1, 2, 6, 24];

type DraftState = {
	launchDate: string;
	launchTime: string;
	presalePrice: number;
	modalTitle: string;
	modalBody: string;
	modalIntervalHours: number;
};

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function toDraftState(record: PresaleRecord): DraftState {
	const launch = new Date(record.launchAt);
	const valid = !Number.isNaN(launch.getTime());
	return {
		launchDate: valid ? `${launch.getFullYear()}-${pad(launch.getMonth() + 1)}-${pad(launch.getDate())}` : "",
		launchTime: valid ? `${pad(launch.getHours())}:${pad(launch.getMinutes())}` : "19:00",
		presalePrice: record.presalePrice,
		modalTitle: record.modalTitle,
		modalBody: record.modalBody,
		modalIntervalHours: record.modalIntervalHours,
	};
}

function draftLaunchAtIso(draft: DraftState, fallback: string) {
	if (!draft.launchDate || !draft.launchTime) return fallback;
	const date = new Date(`${draft.launchDate}T${draft.launchTime}:00`);
	return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

const fieldStyle: React.CSSProperties = {
	height: 52,
	boxSizing: "border-box",
	padding: "0 14px",
	background: "var(--ad-sheet)",
	border: "1px solid var(--ad-line-strong)",
	fontSize: 16,
	color: "var(--ad-text)",
	fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
	display: "block",
	marginBottom: 8,
	fontSize: 10,
	fontWeight: 900,
	letterSpacing: "0.24em",
	textTransform: "uppercase",
	color: "var(--ad-text-label)",
};

const primaryButtonStyle: React.CSSProperties = {
	height: 48,
	padding: "0 24px",
	background: "var(--ad-wine)",
	color: "#fff",
	border: "none",
	fontSize: 11,
	fontWeight: 900,
	letterSpacing: "0.24em",
	textTransform: "uppercase",
	cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
	height: 48,
	padding: "0 20px",
	background: "var(--ad-sheet)",
	color: "var(--ad-text)",
	border: "1px solid var(--ad-line-strong)",
	fontSize: 11,
	fontWeight: 900,
	letterSpacing: "0.24em",
	textTransform: "uppercase",
	cursor: "pointer",
};

/**
 * Assistente de 4 passos, idêntico ao fluxo do canvas "Prevenda - Sistema",
 * mas com o texto de cobrança corrigido: a Asaas hospedada cobra na hora do
 * checkout, não numa cobrança em lote na data de estreia (ADR-0002) — o
 * canvas assumia captura diferida, que não é o que o backend faz de verdade.
 * Reutilizado em /ativacao (primeiro login) e em /admin/pre-venda (nova
 * pré-venda / editar aviso).
 */
export function PresaleWizard({
	presale,
	initialStep = 1,
	onPublished,
	publishLabel = "Publicar pré-venda",
	rail,
	banner,
}: {
	presale: PresaleRecord;
	initialStep?: number;
	onPublished: () => void | Promise<void>;
	publishLabel?: string;
	/** Quando presente, troca o SlCheckoutStepper horizontal pela trilha vertical
	 * escura do canvas "Prevenda - Sistema" — só faz sentido no assistente de
	 * primeiro acesso (`/ativacao`), daí o texto "Primeiro acesso" ser explícito
	 * aqui em vez de inferido pelo caller. */
	rail?: { eyebrow: string; title: string; subtitle: string };
	/** Aviso (ex.: erro de ativação) mostrado acima da trilha de passos, só usado com `rail`. */
	banner?: ReactNode;
}) {
	const [step, setStep] = useState(initialStep);
	const [draft, setDraft] = useState<DraftState>(() => toDraftState(presale));
	const [saving, setSaving] = useState(false);
	const [savedAt, setSavedAt] = useState<string | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [publishing, setPublishing] = useState(false);
	const [publishError, setPublishError] = useState<string | null>(null);
	const draftRef = useRef(draft);
	const hasMountedRef = useRef(false);
	const saveTokenRef = useRef(0);

	useEffect(() => {
		draftRef.current = draft;
	}, [draft]);

	// Autosave a cada ~3s de idle -- mesmo padrão saveTokenRef/setTimeout do
	// editor de blocos (editorial-blocks-editor.client.tsx), só com delay maior.
	useEffect(() => {
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			return;
		}
		const token = ++saveTokenRef.current;
		setSaving(true);
		setSaveError(null);
		const timer = window.setTimeout(async () => {
			const current = draftRef.current;
			const result = await savePresaleDraftAction(presale.id, {
				launchAt: draftLaunchAtIso(current, presale.launchAt),
				presalePrice: current.presalePrice,
				modalTitle: current.modalTitle,
				modalBody: current.modalBody,
				modalIntervalHours: current.modalIntervalHours,
			});
			if (saveTokenRef.current !== token) return;
			setSaving(false);
			if (result.status === "saved") {
				setSavedAt(`${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`);
			} else {
				setSaveError(result.message);
			}
		}, AUTOSAVE_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [draft, presale.id, presale.launchAt]);

	function setField<K extends keyof DraftState>(key: K, value: DraftState[K]) {
		setDraft((prev) => ({ ...prev, [key]: value }));
	}

	const fullPrice = presale.fullPrice;
	const pct = presaleDiscountPercent(fullPrice, draft.presalePrice);
	const launchAtIso = draftLaunchAtIso(draft, presale.launchAt);
	const launchDateObj = new Date(launchAtIso);
	const daysRemaining = Math.max(0, Math.ceil((launchDateObj.getTime() - Date.now()) / 86_400_000));
	const shortLaunchDate = Number.isNaN(launchDateObj.getTime())
		? "—"
		: `${pad(launchDateObj.getDate())}/${pad(launchDateObj.getMonth() + 1)}`;

	async function handlePublish() {
		setPublishing(true);
		setPublishError(null);
		const result = await publishPresaleAction(presale.id, { status: "idle" });
		setPublishing(false);
		if (result.status === "failed") {
			setPublishError(result.message);
			return;
		}
		await onPublished();
	}

	const saveStatusText = saveError
		? `Erro ao salvar rascunho: ${saveError}`
		: saving
			? "Salvando rascunho…"
			: savedAt
				? `Rascunho salvo às ${savedAt}`
				: "";

	// Hint por passo na trilha (rail) e nos passos concluídos — mesma ideia do
	// canvas ("hints"), mas com o texto de cobrança já corrigido pra reserva
	// no checkout em vez de captura em lote na estreia.
	const stepHints = [
		formatLongDate(launchAtIso),
		`${formatBRL(draft.presalePrice)} · −${pct}%`,
		`Aviso a cada ${draft.modalIntervalHours}h`,
		presale.published ? "No ar" : "Rascunho",
	];

	// Prévia troca de cartão pra aviso a partir do passo 3 — mesma regra do
	// canvas (previaCartao / previaModal): antes do passo 3 ninguém viu o
	// aviso ainda, então a prévia mais honesta é o cartão de produto.
	const previewPane = (
		<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
			<span style={{ ...labelStyle, color: "var(--ad-wine)" }}>
				{step < 3 ? "Prévia · cartão na loja" : "Prévia · aviso no site"}
			</span>
			{step < 3 ? (
				<PresaleCardPreview fullPrice={fullPrice} presalePrice={draft.presalePrice} />
			) : (
				<PresaleModalContent
					title={draft.modalTitle}
					body={draft.modalBody}
					fullPrice={fullPrice}
					presalePrice={draft.presalePrice}
					launchAt={launchAtIso}
					ctaHref="#"
				/>
			)}
		</div>
	);

	const stepContent = (
		<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
			{step === 1 ? (
				<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
					<div>
						<h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>
							Quando o livro estreia
						</h2>
						<p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--ad-text-muted)" }}>
							A pré-venda começa agora e vai até essa data. Cada reserva já é cobrada na hora, no checkout —
							não existe uma cobrança em lote na estreia.
						</p>
					</div>
					<div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
						<label style={{ minWidth: 220 }}>
							<span style={labelStyle}>Data da estreia</span>
							<input
								type="date"
								style={fieldStyle}
								value={draft.launchDate}
								onChange={(event) => setField("launchDate", event.target.value)}
							/>
						</label>
						<label style={{ width: 160 }}>
							<span style={labelStyle}>Hora</span>
							<input
								type="time"
								style={fieldStyle}
								value={draft.launchTime}
								onChange={(event) => setField("launchTime", event.target.value)}
							/>
						</label>
					</div>
					<div
						style={{
							border: "1px solid var(--ad-line-sheet)",
							background: "var(--ad-sheet)",
							padding: 20,
							display: "flex",
							gap: 16,
							flexWrap: "wrap",
						}}
					>
						<Stat label="reservas abrem" value="hoje" />
						<Stat label="até a estreia" value={`${daysRemaining} dias`} accent />
						<Stat label="estreia" value={shortLaunchDate} />
					</div>
					<StepActions onNext={() => setStep(2)} />
				</div>
			) : null}

			{step === 2 ? (
				<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
					<div>
						<h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>
							Quanto custa na pré-venda
						</h2>
						<p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--ad-text-muted)" }}>
							Quem reserva agora paga esse valor, cobrado na hora da reserva.
						</p>
					</div>
					<div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
						<div>
							<span style={labelStyle}>Preço cheio</span>
							<div
								style={{
									...fieldStyle,
									display: "flex",
									alignItems: "center",
									background: "var(--ad-sand)",
								}}
							>
								{formatBRL(fullPrice)}
							</div>
						</div>
						<label>
							<span style={labelStyle}>Preço de pré-venda</span>
							<input
								type="number"
								step="1"
								style={{ ...fieldStyle, width: 190 }}
								value={draft.presalePrice}
								onChange={(event) => setField("presalePrice", Number(event.target.value))}
							/>
						</label>
						<div style={{ display: "flex", gap: 8, paddingBottom: 2 }}>
							{DISCOUNT_SHORTCUTS.map((discount) => {
								const value = Math.round(fullPrice * (1 - discount / 100) * 100) / 100;
								const active = Math.abs(value - draft.presalePrice) < 0.005;
								return (
									<button
										key={discount}
										type="button"
										onClick={() => setField("presalePrice", value)}
										style={active ? primaryButtonStyle : secondaryButtonStyle}
									>
										−{discount}%
									</button>
								);
							})}
						</div>
					</div>
					<div
						style={{
							border: "1px solid var(--ad-line-sheet)",
							background: "var(--ad-sheet)",
							padding: 20,
							display: "flex",
							gap: 36,
							flexWrap: "wrap",
						}}
					>
						<Stat label="desconto" value={`−${pct}%`} accent />
						<Stat label="o cliente economiza" value={formatBRL(fullPrice - draft.presalePrice)} />
						<Stat label="cobrança" value="na reserva" />
					</div>
					<StepActions onBack={() => setStep(1)} onNext={() => setStep(3)} />
				</div>
			) : null}

			{step === 3 ? (
				<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
					<div>
						<h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>
							Como aparece no site
						</h2>
						<p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--ad-text-muted)" }}>
							O aviso abre sozinho para quem está navegando. A prévia ao lado é exatamente o que o visitante
							vê.
						</p>
					</div>
					<label>
						<span style={labelStyle}>Título do aviso</span>
						<input
							type="text"
							style={{ ...fieldStyle, width: "100%" }}
							value={draft.modalTitle}
							onChange={(event) => setField("modalTitle", event.target.value)}
						/>
					</label>
					<label>
						<span style={labelStyle}>Frase</span>
						<input
							type="text"
							style={{ ...fieldStyle, width: "100%" }}
							value={draft.modalBody}
							onChange={(event) => setField("modalBody", event.target.value)}
						/>
					</label>
					<div>
						<span style={labelStyle}>Aparece de novo a cada</span>
						<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
							{INTERVAL_OPTIONS.map((hours) => (
								<button
									key={hours}
									type="button"
									onClick={() => setField("modalIntervalHours", hours)}
									style={draft.modalIntervalHours === hours ? primaryButtonStyle : secondaryButtonStyle}
								>
									{hours === 24 ? "1 dia" : `${hours} horas`}
								</button>
							))}
						</div>
						<p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--ad-text-quiet)" }}>
							Contado por navegador. Fechar conta como visto. Não aparece em /cart nem /checkout.
						</p>
					</div>
					<StepActions onBack={() => setStep(2)} onNext={() => setStep(4)} />
				</div>
			) : null}

			{step === 4 ? (
				<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
					<h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>
						Revisar e publicar
					</h2>
					<div
						style={{
							border: "1px solid var(--ad-line-sheet)",
							background: "var(--ad-sheet)",
							padding: 24,
						}}
					>
						<p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>
							Quem reservar até {formatLongDate(launchAtIso)} leva little fish, big fish por{" "}
							{formatBRL(draft.presalePrice)} em vez de {formatBRL(fullPrice)} (−{pct}%), cobrado na hora da
							reserva.
						</p>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
						<span style={labelStyle}>O que passa a valer</span>
						<ChecklistItem n="01" text="Reservas abrem agora e o aviso entra no ar no site." />
						<ChecklistItem
							n="02"
							text="Cada reserva é cobrada no próprio checkout, na hora — não existe cobrança única na estreia."
						/>
						<ChecklistItem
							n="03"
							text={`Depois da estreia o produto continua na loja por ${formatBRL(fullPrice)}, sem aviso.`}
						/>
						<ChecklistItem
							n="04"
							accent
							text="Assim que existir uma reserva, esta pré-venda e o produto não podem mais ser apagados — só encerrados."
						/>
					</div>
					{publishError ? <p style={{ color: "var(--ad-wine)", fontSize: 13 }}>{publishError}</p> : null}
					<div style={{ display: "flex", gap: 10 }}>
						<button type="button" onClick={() => setStep(3)} style={secondaryButtonStyle}>
							Voltar
						</button>
						<button
							type="button"
							onClick={() => void handlePublish()}
							disabled={publishing}
							style={primaryButtonStyle}
						>
							{publishing ? "Publicando…" : publishLabel}
						</button>
					</div>
				</div>
			) : null}
		</div>
	);

	if (rail) {
		return (
			<div style={{ display: "flex", alignItems: "stretch", minHeight: "100dvh" }}>
				<PresaleWizardRail rail={rail} step={step} hints={stepHints} onStepClick={setStep} />

				<div
					style={{
						flex: 1,
						minWidth: 0,
						padding: "28px 32px",
						display: "flex",
						flexDirection: "column",
						gap: 22,
					}}
				>
					{banner}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							fontSize: 10,
							fontWeight: 900,
							letterSpacing: "0.24em",
							textTransform: "uppercase",
							color: "var(--ad-text-quiet)",
						}}
					>
						<span>Pré-vendas</span>
						<span>/</span>
						<span>Nova</span>
						<span>/</span>
						<span style={{ color: "var(--ad-wine)" }}>{STEPS[step - 1]}</span>
					</div>
					{stepContent}
				</div>

				<div
					style={{
						flex: "none",
						width: 340,
						borderLeft: "1px solid var(--ad-line)",
						background: "var(--ad-sheet)",
						padding: "28px 24px",
					}}
				>
					{previewPane}
				</div>
			</div>
		);
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
			<SlCheckoutStepper
				steps={STEPS}
				current={step}
				onInk={false}
				onStepClick={(target) => setStep(target)}
			/>

			<div
				style={{ fontSize: 12, color: saveError ? "var(--ad-wine)" : "var(--ad-text-quiet)", minHeight: 16 }}
			>
				{saveStatusText}
			</div>

			<div style={{ display: "grid", gap: 32, gridTemplateColumns: "minmax(0, 1fr) 320px" }}>
				{stepContent}
				{previewPane}
			</div>
		</div>
	);
}

/** Trilha vertical escura (canvas "Prevenda - Sistema", tela do assistente de
 * primeiro acesso): 268px, shell ink, item ativo em bloco sólido claro. */
function PresaleWizardRail({
	rail,
	step,
	hints,
	onStepClick,
}: {
	rail: { eyebrow: string; title: string; subtitle: string };
	step: number;
	hints: string[];
	onStepClick: (step: number) => void;
}) {
	return (
		<div
			style={{
				flex: "none",
				width: 268,
				background: "var(--ad-shell)",
				color: "var(--ad-on-shell)",
				padding: "28px 0",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div style={{ padding: "0 26px 22px" }}>
				<p
					style={{
						margin: 0,
						fontSize: 10,
						fontWeight: 900,
						letterSpacing: "0.26em",
						textTransform: "uppercase",
						color: "var(--ad-on-shell-label)",
					}}
				>
					{rail.eyebrow}
				</p>
				<p
					style={{
						margin: "8px 0 0",
						fontSize: 22,
						fontWeight: 900,
						lineHeight: 1.05,
						textTransform: "uppercase",
						letterSpacing: "-0.03em",
					}}
				>
					{rail.title}
				</p>
				<p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--ad-on-shell-soft)" }}>
					{rail.subtitle}
				</p>
			</div>

			<div style={{ display: "flex", flexDirection: "column" }}>
				{STEPS.map((label, index) => {
					const n = index + 1;
					const active = n === step;
					const done = n < step;
					return (
						<button
							key={label}
							type="button"
							onClick={() => onStepClick(n)}
							style={{
								display: "flex",
								gap: 14,
								width: "100%",
								padding: "14px 26px",
								textAlign: "left",
								background: active ? "var(--ad-on-shell)" : "transparent",
								color: active ? "var(--ad-shell)" : "var(--ad-on-shell)",
								border: "none",
								borderLeft: `4px solid ${active || done ? "var(--ad-selected)" : "transparent"}`,
								cursor: "pointer",
								font: "inherit",
							}}
						>
							<span
								style={{
									flex: "none",
									fontFamily: "var(--ad-font-mono)",
									fontSize: 16,
									color: active ? "var(--ad-wine)" : done ? "var(--ad-sand)" : "var(--ad-on-shell-quiet)",
								}}
							>
								{pad(n)}
							</span>
							<span>
								<span style={{ display: "block", fontSize: 14, fontWeight: 900 }}>{label}</span>
								{active || done ? (
									<span
										style={{
											display: "block",
											fontSize: 12,
											color: active ? "var(--ad-text-label)" : "var(--ad-on-shell-soft)",
										}}
									>
										{hints[index]}
									</span>
								) : null}
							</span>
						</button>
					);
				})}
			</div>

			<div style={{ marginTop: "auto", padding: "22px 26px 0" }}>
				<span style={{ display: "block", height: 1, background: "var(--ad-shell-line)", marginBottom: 16 }} />
				<p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--ad-on-shell-soft)" }}>
					Rascunho salvo automaticamente. Nada vai ao ar antes do passo 4.
				</p>
			</div>
		</div>
	);
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
			<span style={{ fontSize: 22, fontWeight: 700, color: accent ? "var(--ad-wine)" : "var(--ad-text)" }}>
				{value}
			</span>
			<span style={{ fontSize: 12, color: "var(--ad-text-quiet)" }}>{label}</span>
		</div>
	);
}

function ChecklistItem({ n, text, accent }: { n: string; text: string; accent?: boolean }) {
	return (
		<div
			style={{
				display: "flex",
				gap: 12,
				padding: "14px 16px",
				border: accent ? "1px solid var(--ad-wine-line)" : "1px solid var(--ad-line-sheet)",
				background: accent ? "var(--ad-wine-wash)" : "var(--ad-sheet)",
			}}
		>
			<span style={{ color: "var(--ad-wine)", fontWeight: 700 }}>{n}</span>
			<span style={{ fontSize: 14, lineHeight: 1.6, color: accent ? "var(--ad-wine)" : "var(--ad-text)" }}>
				{text}
			</span>
		</div>
	);
}

function StepActions({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
	return (
		<div style={{ display: "flex", gap: 10 }}>
			{onBack ? (
				<button type="button" onClick={onBack} style={secondaryButtonStyle}>
					Voltar
				</button>
			) : null}
			<button type="button" onClick={onNext} style={primaryButtonStyle}>
				Continuar
			</button>
		</div>
	);
}
