"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const HIDDEN_PREFIXES = ["/pre-venda"];

/** Hides the pre-rendered nav on routes where the main site navbar shouldn't show (pré-venda). */
export function NavVisibilityGate({ children }: { children: ReactNode }) {
	const pathname = usePathname() || "/";
	const hidden = HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
	if (hidden) return null;
	return <>{children}</>;
}
