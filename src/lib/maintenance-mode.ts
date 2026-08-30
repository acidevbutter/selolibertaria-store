/**
 * Read directly from process.env (no @t3-oss/env-nextjs) so this stays safe
 * to import from the edge proxy, matching how the FastAPI session is read there.
 */
export function isMaintenanceModeEnabled() {
	return process.env.MAINTENANCE_MODE === "true";
}
