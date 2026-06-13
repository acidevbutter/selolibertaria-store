"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "@/i18n/client";

export const ThemeToggle = ({ className = "" }: { className?: string }) => {
	const { theme, setTheme, systemTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const t = useTranslations("Global.actions");

	useEffect(() => setMounted(true), []);

	if (!mounted)
		return (
			<button aria-label={t("toggleTheme")} className={className}>
				<Sun size={16} />
			</button>
		);

	const activeTheme = theme === "system" ? systemTheme : theme;

	return (
		<button
			aria-label={t("toggleTheme")}
			className={className + " inline-flex items-center justify-center p-2 rounded-md hover:bg-accent/10 "}
			onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")}
		>
			{activeTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
		</button>
	);
};

export default ThemeToggle;
