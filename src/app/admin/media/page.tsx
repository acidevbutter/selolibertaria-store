import { redirect } from "next/navigation";
import { MediaLibraryGrid } from "@/app/admin/media/_components/media-library-grid.client";
import { env } from "@/env.mjs";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";

export const dynamic = "force-dynamic";

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
		<>
			<div className="ad-head">
				<h1>Biblioteca de mídia</h1>
				<span className="ad-meta">
					{total} arquivo(s) · {formatBytes(totalBytes)} nesta página
				</span>
			</div>

			<form method="get" className="ad-filters" style={{ gap: 10 }}>
				<label htmlFor="media-search" className="ad-ml" style={{ display: "none" }}>
					Buscar por nome do arquivo ou descrição
				</label>
				<div className="ad-field" style={{ flex: "1 1 260px" }}>
					<input id="media-search" name="q" defaultValue={q} placeholder="capa-evento.png, sarau..." />
				</div>
				<button type="submit" className="ad-btn ad-pri">
					Buscar
				</button>
				{q ? (
					<a className="ad-btn ad-sec" href="/admin/media">
						Limpar
					</a>
				) : null}
			</form>

			<div className="ad-panel">
				<div style={{ padding: 20 }}>
					<MediaLibraryGrid
						items={items.map((item) => ({
							id: item.id,
							url: item.url,
							filename: item.filename,
							alt: item.alt,
							bytes: item.bytes,
							width: item.width,
							height: item.height,
							createdAtLabel: new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: "short" }).format(
								new Date(item.created_at),
							),
						}))}
					/>
				</div>

				<div className="ad-foot">
					<span className="ad-mono" style={{ fontSize: 12, color: "var(--ad-text-soft)" }}>
						Mostrando {items.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} -{" "}
						{(page - 1) * PAGE_SIZE + items.length} de {total} arquivo(s)
					</span>
					<span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
						{previousHref ? (
							<a className="ad-btn ad-sec" href={previousHref}>
								Anterior
							</a>
						) : null}
						{nextHref ? (
							<a className="ad-btn ad-sec" href={nextHref}>
								Próximo
							</a>
						) : null}
					</span>
				</div>
			</div>
		</>
	);
}
