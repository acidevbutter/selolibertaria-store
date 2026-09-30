/**
 * Turns an HTTP status from the FastAPI backend into something the site owner can act on.
 *
 * The admin talks to the backend server-to-server, authenticated by an internal key. When that
 * key does not match on both sides the backend answers 401 to *every* internal call -- and the
 * editor used to treat that like "there is nothing saved yet" and open an empty page. These
 * messages exist so a refusal is never mistaken for missing content.
 */

export type BackendAction = "carregar" | "salvar" | "publicar" | "enviar";

export const BACKEND_AUTH_HINT =
	"O servidor recusou a chave interna entre a loja e o backend. Nada foi perdido: avise o suporte para conferir FASTAPI_INTERNAL_API_KEY (loja) e INTERNAL_API_KEY (backend).";

export function describeBackendStatus(
	status: number,
	what: string,
	action: BackendAction = "carregar",
): string {
	if (status === 401) return `Não foi possível ${action} ${what} (401). ${BACKEND_AUTH_HINT}`;
	if (status === 403) return `Você não tem permissão para ${action} ${what} (403).`;
	if (status === 404) return `Não foi possível ${action} ${what}: registro não encontrado no servidor (404).`;
	if (status >= 500) return `O servidor falhou ao ${action} ${what} (${status}). Tente de novo em instantes.`;
	return `Não foi possível ${action} ${what} (${status}).`;
}
