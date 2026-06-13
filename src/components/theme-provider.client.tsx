"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export const ThemeProviderWrapper = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="light"
			enableSystem={false}
			enableColorScheme={false}
			storageKey="theme"
		>
			{children}
		</ThemeProvider>
	);
};

export default ThemeProviderWrapper;
