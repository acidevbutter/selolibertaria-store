"use client";

import { useAdminTheme } from "@/app/admin/_components/admin-theme-provider.client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

export function AdminThemeSelector() {
	const { theme, setTheme } = useAdminTheme();
	return (
		<div className="max-w-sm space-y-2">
			<div className="space-y-1">
				<label className="block text-sm font-medium">Tema do admin</label>
				<p className="text-sm text-[var(--sl-text-muted)]">
					Escolha a leitura visual do admin sem alterar a experiência pública da loja.
				</p>
			</div>
			<Select
				value={theme}
				onValueChange={async (v) => {
					const next = (v as "light" | "dark") ?? "light";
					setTheme(next); // updates context + persists to DB via provider
				}}
			>
				<SelectTrigger
					className="max-w-[12rem] border-[var(--sl-line)] bg-[var(--sl-paper-pure)]"
					style={{ borderRadius: "var(--sl-radius)" }}
				>
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
