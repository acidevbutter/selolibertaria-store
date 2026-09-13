import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn<Row> = {
	key: string;
	label: ReactNode;
	/** Fixed track width for the grid column; defaults to a flexible fraction. */
	width?: string;
	/** Render the value in DCC Ash (money, counts, order numbers). */
	numeric?: boolean;
	render?: (row: Row) => ReactNode;
};

type DataTableProps<Row extends { id?: string | number }> = {
	columns: DataTableColumn<Row>[];
	rows: Row[];
	/** Empty-state copy — always say what to do next, never a bare "nothing here". */
	empty?: ReactNode;
	zebra?: boolean;
	selectable?: boolean;
	selectedIds?: Set<string | number>;
	onToggleRow?: (row: Row) => void;
	onToggleAll?: (checked: boolean) => void;
	className?: string;
};

/**
 * The panel's single table — orders, products, users. One shared
 * implementation so every list gets the same header, row divider and
 * money-in-DCC-Ash rule for free.
 */
export function DataTable<Row extends { id?: string | number }>({
	columns,
	rows,
	empty,
	zebra = true,
	selectable = false,
	selectedIds,
	onToggleRow,
	onToggleAll,
	className,
}: DataTableProps<Row>) {
	const gridTemplateColumns = [selectable ? "24px" : null, ...columns.map((c) => c.width || "minmax(0,1fr)")]
		.filter(Boolean)
		.join(" ");
	const allSelected = selectable && rows.length > 0 && rows.every((row) => selectedIds?.has(row.id ?? ""));

	return (
		<div
			className={cn(
				"border border-[var(--sl-line-hairline)] bg-[var(--sl-surface-card)] text-[var(--sl-text)]",
				className,
			)}
			style={{ borderRadius: "var(--sl-radius)" }}
		>
			<div
				className="grid items-center gap-4 border-b border-[var(--sl-line)] p-[var(--sl-pad-table-head)] bg-[var(--sl-surface-band)] text-[10px] font-black tracking-[var(--sl-track-label-tight)] text-[var(--sl-text-label)] uppercase"
				style={{ gridTemplateColumns }}
			>
				{selectable ? (
					<input
						type="checkbox"
						checked={allSelected}
						onChange={(e) => onToggleAll?.(e.target.checked)}
						aria-label="Selecionar todos"
					/>
				) : null}
				{columns.map((c) => (
					<span key={c.key}>{c.label}</span>
				))}
			</div>

			{rows.length === 0 ? (
				<div className="bg-[var(--sl-surface-band)] p-6 text-[14px] leading-[var(--sl-leading-compact)] text-[var(--sl-text-muted)]">
					{empty || "Nenhum resultado para este período. Troque o filtro ou veja todos os registros."}
				</div>
			) : (
				rows.map((row, i) => {
					const selected = selectable && selectedIds?.has(row.id ?? "");
					return (
						<div
							key={row.id ?? i}
							className={cn(
								"grid items-center gap-4 p-[var(--sl-pad-table-cell)] text-[15px] transition-[var(--sl-transition)]",
								i === rows.length - 1 ? "" : "border-b border-[var(--sl-line-hairline)]",
								selected
									? "bg-[var(--sl-surface-row-hover)]"
									: zebra && i % 2 === 1
										? "bg-[var(--sl-surface-row-hover)]"
										: "",
							)}
							style={{ gridTemplateColumns }}
						>
							{selectable ? (
								<input
									type="checkbox"
									checked={selected ?? false}
									onChange={() => onToggleRow?.(row)}
									aria-label="Selecionar linha"
								/>
							) : null}
							{columns.map((c) => (
								<span
									key={c.key}
									className={cn(
										"min-w-0 break-words",
										c.numeric && "font-[family-name:var(--sl-font-display)] text-[18px]",
									)}
								>
									{c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
								</span>
							))}
						</div>
					);
				})
			)}
		</div>
	);
}
