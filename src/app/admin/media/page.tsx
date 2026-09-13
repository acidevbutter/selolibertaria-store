import { ImageOff } from "lucide-react";
import NextImage from "next/image";
import { redirect } from "next/navigation";
import { env } from "@/env.mjs";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { SlButton } from "@/ui/sl/sl-button";

export const dynamic = "force-dynamic";

const fieldClassName =
	"h-10 w-full border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-3 text-sm text-[var(--sl-ink)] outline-none placeholder:text-[color:var(--sl-text-disabled)]";
const fieldStyle = { borderRadius: "var(--sl-radius)" } as const;
const PAGE_SIZE = 25;

type SearchParams = { q?: string | string[]; page?: string | string[] };

type MediaAssetResponse = {
	id: string;
	url: string;
	public_id: string;
	filename: string;
	mime_type: string;
	bytes: number;
	width: number | null;
	height: number | null;
	alt: string;
	created_at: string;
};

type MediaListResponse = {
	items: MediaAssetResponse[];
	total: number;
};

function asString(value: string | string[] | undefined) {
	return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildPageHref({ q, page }: { q: string; page: number }) {
	const params = new URLSearchParams();
	if (q) params.set("q", q);
	if (page > 1) params.set("page", String(page));
	const query = params.toString();
	return query ? `/admin/media?${query}` : "/admin/media";
}

export default async function AdminMediaPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "catalog.write")) redirect("/forbidden");

	const resolved = (await searchParams) || {};
	const q = (asString(resolved.q) || "").trim();
	const page = Math.max(Number(asString(resolved.page) || "1"), 1);

	const queryParams = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
	if (q) queryParams.set("q", q);
	const response = await fetch(`${env.FASTAPI_API_URL}/media/internal/admin?${queryParams}`, {
		headers: { "x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY },
		cache: "no-store",
	});
	if (!response.ok) throw new Error("Não foi possível carregar a biblioteca de mídia.");
	const mediaPage = (await response.json()) as MediaListResponse;
	const items = mediaPage.items;
	const total = mediaPage.total;
	const totalBytes = items.reduce((sum, item) => sum + item.bytes, 0);

	const previousHref = page > 1 ? buildPageHref({ q, page: page - 1 }) : null;
	const nextHref = page * PAGE_SIZE < total ? buildPageHref({ q, page: page + 1 }) : null;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Mídia"
				title="Biblioteca de mídia"
				description="Reveja o que já foi enviado antes de subir uma imagem nova."
				actions={
					<div className="w-full max-w-2xl border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-4">
						<form method="get" className="flex flex-wrap items-end gap-3">
							<div className="min-w-[220px] flex-1">
								<label htmlFor="media-search" className="mb-2 block text-sm text-[var(--sl-text-muted)]">
									Buscar por nome do arquivo ou descrição
								</label>
								<input
									id="media-search"
									name="q"
									defaultValue={q}
									placeholder="capa-evento.png, sarau..."
									className={fieldClassName}
									style={fieldStyle}
								/>
							</div>
							<div className="flex flex-wrap gap-2">
								<SlButton type="submit" variant="primary">
									Buscar
								</SlButton>
								<SlButton href="/admin/media" variant="secondary">
									Limpar
								</SlButton>
							</div>
						</form>
					</div>
				}
			/>
			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat label="Arquivos" value={total} helper="Resultados do filtro atual." />
				<AdminEditorialStat
					label="Espaço nesta página"
					value={formatBytes(totalBytes)}
					helper={`Somado entre os ${items.length} itens exibidos.`}
				/>
				<AdminEditorialStat
					label="Envio de imagens"
					value="Pelos formulários"
					helper="Envie imagens diretamente no editorial ou no produto; elas aparecem aqui automaticamente."
				/>
			</div>
			<EditorialPanel className="p-0">
				<div className="border-b border-[var(--sl-line)] px-6 py-5 sm:px-8">
					<div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
						Arquivos enviados
					</div>
				</div>
				<div className="space-y-4 p-6 sm:p-8">
					{items.length === 0 ? (
						<div className="flex flex-col items-center gap-2 border border-dashed border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-6 py-12 text-center">
							<ImageOff className="h-6 w-6 text-[var(--sl-text-muted)]" />
							<p className="text-sm font-semibold text-[var(--sl-ink)]">
								Nenhuma imagem ainda — arraste a primeira.
							</p>
							<p className="max-w-md text-sm leading-6 text-[var(--sl-text-muted)]">
								Envie uma imagem pelo editorial ou por um produto. Ela passa a aparecer nesta biblioteca
								automaticamente.
							</p>
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
							{items.map((item) => (
								<div
									key={item.id}
									className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)]"
									style={{ borderRadius: "var(--sl-radius)" }}
								>
									<div className="relative aspect-square overflow-hidden border-b border-[var(--sl-line)] bg-[var(--sl-surface-quiet)]">
										<NextImage
											src={item.url}
											alt={item.alt || item.filename}
											fill
											sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw"
											className="object-cover"
											{...getProductImageOptimizationProps(item.url)}
										/>
									</div>
									<div className="space-y-1 p-3">
										<p className="truncate text-xs font-semibold text-[var(--sl-ink)]" title={item.filename}>
											{item.filename}
										</p>
										<p className="text-[11px] text-[var(--sl-text-muted)]">
											{item.width && item.height ? `${item.width}×${item.height} · ` : ""}
											{formatBytes(item.bytes)}
										</p>
										<p className="text-[11px] text-[var(--sl-text-muted)]">
											{new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: "short" }).format(
												new Date(item.created_at),
											)}
										</p>
									</div>
								</div>
							))}
						</div>
					)}

					<div className="flex flex-col gap-3 border-t border-[var(--sl-line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-[var(--sl-text-muted)]">
							Mostrando {items.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} -{" "}
							{(page - 1) * PAGE_SIZE + items.length} de {total} arquivo(s).
						</p>
						<div className="flex items-center gap-2">
							{previousHref ? (
								<SlButton href={previousHref} variant="secondary" size="sm">
									Anterior
								</SlButton>
							) : null}
							{nextHref ? (
								<SlButton href={nextHref} variant="secondary" size="sm">
									Próximo
								</SlButton>
							) : null}
						</div>
					</div>
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
