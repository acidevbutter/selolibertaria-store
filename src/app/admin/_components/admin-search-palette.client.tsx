"use client";

import {
	createContext,
	Fragment,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useAdminRouteProgress } from "@/app/admin/_components/admin-route-progress.client";

export type SearchEntry = {
	/** Group heading in the palette: "Páginas e eventos", "Operação", "Ações". */
	group: string;
	label: string;
	href: string;
	/** Right-hand data in mono: "rascunho · 12 set", "240 KB · usada em 3", "⌘E". */
	meta?: string;
};

const SearchPaletteContext = createContext<{ open: () => void }>({ open: () => {} });

export function useAdminSearchPalette() {
	return useContext(SearchPaletteContext);
}

function normalize(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

/**
 * Global search (ui_kit `.pal`, §2.1). Opens on ⌘K or by clicking the topbar
 * field; Esc closes, ↑↓ moves, Enter opens. The scrim darkens the shell without
 * hiding it — no spinner and no overlay over the desk content.
 */
export function AdminSearchPaletteProvider({
	entries,
	children,
}: {
	entries: SearchEntry[];
	children: ReactNode;
}) {
	const { navigate } = useAdminRouteProgress();
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	// The palette exists to take the caret: it stays mounted, so focus on open.
	useEffect(() => {
		if (isOpen) inputRef.current?.focus();
	}, [isOpen]);

	const results = useMemo(() => {
		const q = normalize(query.trim());
		if (!q) return entries;
		return entries.filter((entry) => normalize(`${entry.label} ${entry.meta ?? ""}`).includes(q));
	}, [entries, query]);

	useEffect(() => {
		setActiveIndex(0);
	}, [query]);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setIsOpen((open) => !open);
				return;
			}
			if (!isOpen) return;
			if (event.key === "Escape") {
				event.preventDefault();
				setIsOpen(false);
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [isOpen]);

	function choose(entry: SearchEntry | undefined) {
		if (!entry) return;
		setIsOpen(false);
		setQuery("");
		navigate(entry.href);
	}

	const value = useMemo(() => ({ open: () => setIsOpen(true) }), []);

	let lastGroup: string | null = null;

	return (
		<SearchPaletteContext.Provider value={value}>
			{children}
			<div
				className={`ad-scrim${isOpen ? " on" : ""}`}
				onClick={(event) => {
					if (event.target === event.currentTarget) setIsOpen(false);
				}}
			>
				<div className="ad-pal" role="dialog" aria-label="Buscar em todo o painel">
					<div className="ad-q">
						<span aria-hidden="true" style={{ fontSize: 18, color: "var(--ad-on-shell-label)" }}>
							⌕
						</span>
						<input
							ref={inputRef}
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "ArrowDown") {
									event.preventDefault();
									setActiveIndex((index) => Math.min(index + 1, results.length - 1));
								}
								if (event.key === "ArrowUp") {
									event.preventDefault();
									setActiveIndex((index) => Math.max(index - 1, 0));
								}
								if (event.key === "Enter") {
									event.preventDefault();
									choose(results[activeIndex]);
								}
							}}
							placeholder="Buscar página, evento, pedido ou imagem"
						/>
						<span className="ad-mono" style={{ fontSize: 11, color: "var(--ad-on-shell-label)" }}>
							esc fecha
						</span>
					</div>

					<div className="ad-results">
						{results.map((entry, index) => {
							const heading = entry.group === lastGroup ? null : entry.group;
							lastGroup = entry.group;

							return (
								<Fragment key={`${entry.href}-${entry.label}`}>
									{heading ? <div className="ad-g">{heading}</div> : null}
									<button
										type="button"
										className={`ad-r${index === activeIndex ? " on" : ""}`}
										onMouseEnter={() => setActiveIndex(index)}
										onClick={() => choose(entry)}
									>
										{entry.label}
										{entry.meta ? <span className="ad-k">{entry.meta}</span> : null}
									</button>
								</Fragment>
							);
						})}

						{results.length === 0 ? <div className="ad-g">Nada encontrado</div> : null}
					</div>

					<div className="ad-hint">
						<span>↑↓ navega</span>
						<span>enter abre</span>
						<span>⌘K fecha</span>
					</div>
				</div>
			</div>
		</SearchPaletteContext.Provider>
	);
}
