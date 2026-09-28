import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn<Row> = {
	key: string;
	label: ReactNode;
	/** Fixed track width for the grid column; defaults to a flexible fraction. */
	width?: string;
	/** Render the value in mono, tabular numerals (money, counts, order numbers). */
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
	/** Makes each row clickable (e.g. to open a detail view) without a dedicated "actions" column. */
	onRowClick?: (row: Row) => void;
	className?: string;
};

/**
 * The panel's single table — orders, products, users. One shared
 * implementation so every list gets the same header, row divider and
 * mono-numerals rule for free.
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
	onRowClick,
	className,
}: DataTableProps<Row>) {
	const gridTemplateColumns = [selectable ? "24px" : null, ...columns.map((c) => c.width || "minmax(0,1fr)")]
		.filter(Boolean)
		.join(" ");
	const allSelected = selectable && rows.length > 0 && rows.every((row) => selectedIds?.has(row.id ?? ""));

	return (
		<div className={cn("ad-panel", className)}>
			<div className="ad-thead" style={{ gridTemplateColumns }}>
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
				<div className="ad-empty">
					<span className="ad-body">
						{empty || "Nenhum resultado para este período. Troque o filtro ou veja todos os registros."}
					</span>
				</div>
			) : (
				rows.map((row, i) => {
					const selected = selectable && selectedIds?.has(row.id ?? "");
					return (
						<div
							key={row.id ?? i}
							className={cn(
								"ad-trow",
								onRowClick && "cursor-pointer",
								selected || (zebra && i % 2 === 1) ? "bg-[var(--ad-row-hover)]" : "",
							)}
							style={{ gridTemplateColumns }}
							onClick={onRowClick ? () => onRowClick(row) : undefined}
							onKeyDown={
								onRowClick
									? (e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												onRowClick(row);
											}
										}
									: undefined
							}
							role={onRowClick ? "button" : undefined}
							tabIndex={onRowClick ? 0 : undefined}
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
								<span key={c.key} className={cn("min-w-0 break-words", c.numeric && "ad-num text-[15px]")}>
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
