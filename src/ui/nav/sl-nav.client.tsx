"use client";

import { usePathname } from "next/navigation";
import { YnsLink } from "@/ui/yns-link";

export type SlNavLink = { label: string; href: string };

function isActive(pathname: string, href: string) {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Desktop nav links. Active item = 2px red underline, nothing else coloured.
 * Hover mirrors the active treatment (red underline + full-strength text).
 */
export function SlNavLinks({ links }: { links: SlNavLink[] }) {
	const pathname = usePathname() || "/";
	// Loja stays active across the whole shop surface.
	const shopActive = /^\/(products|product|category|search)(\/|$)/.test(pathname);

	return (
		<nav className="hidden items-center gap-7 lg:flex">
			{links.map((link) => {
				const active = link.href === "/products" ? shopActive : isActive(pathname, link.href);
				return (
					<YnsLink
						key={link.href}
						href={link.href}
						data-active={active || undefined}
						className="inline-flex h-11 items-center border-b-2 border-dashed border-transparent text-[12px] font-bold uppercase tracking-[0.2em] text-[color:var(--sl-text-on-ink-soft)] transition-colors hover:border-[color:var(--sl-buy)] hover:text-[color:var(--sl-text-on-ink)]! data-[active]:border-[color:var(--sl-buy)] data-[active]:text-[color:var(--sl-text-on-ink)]"
					>
						{link.label}
					</YnsLink>
				);
			})}
		</nav>
	);
}
