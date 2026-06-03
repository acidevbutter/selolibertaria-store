"use client";

import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export const HeroShell = ({ children }: { children: ReactNode }) => {
	const { theme, systemTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const activeTheme = theme === "system" ? systemTheme : theme;

	const lightClass = "rounded bg-neutral-100 py-8 sm:py-12";
	const darkClass = "rounded bg-neutral-900 py-8 sm:py-12";

	if (!mounted) {
		// Render light variant until hydration to avoid mismatch
		return <section className={lightClass}>{children}</section>;
	}

	return <section className={activeTheme === "dark" ? darkClass : lightClass}>{children}</section>;
};

export default HeroShell;
