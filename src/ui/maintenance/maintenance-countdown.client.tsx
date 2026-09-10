"use client";

import { useEffect, useState } from "react";
import { computeCountdown, ZERO_COUNTDOWN } from "@/lib/countdown";

const CELL_LABEL_CLASS = "text-[9px] uppercase tracking-[0.2em] text-[color:rgba(247,244,239,0.55)]";
const CELL_VALUE_CLASS =
	"editorial-serif text-[clamp(24px,2.6vw,38px)] font-black leading-none text-[#F7F4EF]";

/** Countdown to `launchAt` (ISO 8601), matching the "Em Construção — little fish, big fish" design 1:1. */
export function MaintenanceCountdown({
	launchAt,
	days,
	hours,
	minutes,
	seconds,
}: {
	launchAt: string;
	days: string;
	hours: string;
	minutes: string;
	seconds: string;
}) {
	const target = Date.parse(launchAt);
	// Starts at the zero placeholder on both server and client — computing from
	// `Date.now()` in the initializer would run at two different instants (SSR
	// render time vs. client hydration time) and mismatch, breaking hydration.
	const [remaining, setRemaining] = useState(ZERO_COUNTDOWN);

	useEffect(() => {
		if (Number.isNaN(target)) return;
		setRemaining(computeCountdown(target, Date.now()));
		const id = window.setInterval(() => setRemaining(computeCountdown(target, Date.now())), 1000);
		return () => window.clearInterval(id);
	}, [target]);

	const cells: Array<[string, string, boolean?]> = [
		[remaining.days, days],
		[remaining.hours, hours],
		[remaining.minutes, minutes],
		[remaining.seconds, seconds, true],
	];

	return (
		<div className="grid grid-cols-4 gap-[10px]" aria-live="off">
			{cells.map(([value, label, accent]) => (
				<div
					key={label}
					className="flex min-w-0 flex-col items-center gap-[5px] border border-[color:rgba(242,137,30,0.35)] px-1 py-[clamp(8px,1.2vh,14px)]"
				>
					<span className={CELL_VALUE_CLASS} style={accent ? { color: "#F2891E" } : undefined}>
						{value}
					</span>
					<span className={CELL_LABEL_CLASS}>{label}</span>
				</div>
			))}
		</div>
	);
}
