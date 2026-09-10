export type CountdownRemaining = {
	days: string;
	hours: string;
	minutes: string;
	seconds: string;
	done: boolean;
};

export const ZERO_COUNTDOWN: CountdownRemaining = {
	days: "00",
	hours: "00",
	minutes: "00",
	seconds: "00",
	done: false,
};

const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

/** Breaks down the ms remaining until `target` (epoch ms) into zero-padded day/hour/min/sec cells. */
export function computeCountdown(target: number, now: number): CountdownRemaining {
	let diff = Math.max(0, target - now);
	const days = Math.floor(diff / 86_400_000);
	diff -= days * 86_400_000;
	const hours = Math.floor(diff / 3_600_000);
	diff -= hours * 3_600_000;
	const minutes = Math.floor(diff / 60_000);
	diff -= minutes * 60_000;
	const seconds = Math.floor(diff / 1000);
	return {
		days: pad(days),
		hours: pad(hours),
		minutes: pad(minutes),
		seconds: pad(seconds),
		done: target - now <= 0,
	};
}
