import { IBM_Plex_Mono } from "next/font/google";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { isBackofficeRole } from "@/lib/authz";
import "@/styles/ad-tokens.css";

// Deliberately outside `/admin`: AdminLayout wraps its whole subtree in the
// sidebar/topbar chrome and would redirect this very page back to itself
// (this route IS the destination of that redirect). This layout repeats only
// the session/role guard, no activation check — the wizard doesn't gate
// itself, and no chrome, since it's a full-bleed screen for a panel that
// isn't unlocked yet.
const ibmPlexMono = IBM_Plex_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-ad-mono",
	display: "swap",
});

export const dynamic = "force-dynamic";

export default async function AtivacaoLayout({ children }: { children: ReactNode }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!isBackofficeRole(session.user.role)) redirect("/forbidden");

	return (
		<div
			className={ibmPlexMono.variable}
			style={{
				minHeight: "100dvh",
				background: "var(--ad-desk)",
				color: "var(--ad-text)",
				fontFamily: "var(--font-ad-mono)",
			}}
		>
			{children}
		</div>
	);
}
