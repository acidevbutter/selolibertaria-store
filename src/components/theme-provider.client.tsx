"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export const ThemeProviderWrapper = ({ children }: { children: ReactNode }) => {
	// Do not force a defaultTheme at the provider level here to avoid
	// server/client hydration mismatch. We keep `attribute="class"` and
	// enableSystem so the theme can be controlled on the client via
	// next-themes. If you want the store to default to dark for *new*
	// visitors, we can set a small client-only effect to call setTheme('dark')
	// after mount instead of relying on server-side defaults.
	return (
		// After observing hydration mismatches where the server rendered the
		// `dark` class on <html> but the client initially rendered without it,
		// explicitly provide a defaultTheme that matches the server's initial
		// rendering to avoid React hydration attribute mismatches. We disable
		// `enableColorScheme` so next-themes doesn't mutate `document.documentElement.style.colorScheme`
		// on initial load (that was producing a style attribute on the server
		// HTML in some environments).
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem={true}
			enableColorScheme={false}
			storageKey="theme"
		>
			{children}
		</ThemeProvider>
	);
};

export default ThemeProviderWrapper;
