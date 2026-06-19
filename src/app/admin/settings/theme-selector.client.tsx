"use client";

import { useAdminTheme } from "@/app/admin/_components/admin-theme-provider.client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

export function AdminThemeSelector() {
	const { theme, setTheme } = useAdminTheme();
	return (
		<div className="max-w-xs">
			<label className="mb-2 block text-sm font-medium">Tema do admin</label>
			<Select
				value={theme}
				onValueChange={async (v) => {
					const next = (v as "light" | "dark") ?? "light";
					setTheme(next); // updates context + persists to DB via provider
				}}
			>
				<SelectTrigger>
					<SelectValue placeholder="Selecione o tema" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="light">Claro</SelectItem>
					<SelectItem value="dark">Escuro</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
