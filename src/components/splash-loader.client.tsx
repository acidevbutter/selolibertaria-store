"use client";

import { useEffect, useRef, useState } from "react";

export default function SplashLoader() {
	const [visible, setVisible] = useState(false);
	const [percent, setPercent] = useState(0);
	const [circle, setCircle] = useState(false);
	const [visibleCircle, setVisibleCircle] = useState(false);
	// store both a triggered flag and the element reference so we can attach the ref to the DOM
	const circleTriggeredRef = useRef<{ triggered: boolean; el: HTMLDivElement | null }>({
		triggered: false,
		el: null,
	});

	const preRemovedRef = useRef(false);
	// remember previous overflow so we can restore it when splash finishes
	const prevOverflowRef = useRef<{ html: string; body: string } | null>(null);

	useEffect(() => {
		// Only run on first visit
		try {
			if (localStorage.getItem("ratoeira_splash_seen")) return;
		} catch (e) {
			// ignore
		}

		// keep pre-hydration overlay until we reach at least 2% to avoid layout jump
		setVisible(true);

		// lock vertical scrolling while splash is visible
		try {
			prevOverflowRef.current = {
				html: document.documentElement.style.overflowY || "",
				body: document.body.style.overflowY || "",
			};
			document.documentElement.style.overflowY = "hidden";
			document.body.style.overflowY = "hidden";
		} catch (e) {
			// ignore if DOM unavailable
		}

		let interval = setInterval(() => {
			setPercent((p) => {
				const next = p + 1;

				// update pre-hydration overlay percent if present
				try {
					const pre = document.getElementById("ratoeira-splash-pre");
					if (pre) {
						pre.innerHTML = `<div class='ratoeira-splash-percent'>${next}%</div>`;
					}
				} catch (e) {}

				// once we reach 2% remove the pre-hydration placeholder (so client-controlled UI shows)
				if (next >= 2 && !preRemovedRef.current) {
					try {
						const pre = document.getElementById("ratoeira-splash-pre");
						const preStyle = document.getElementById("ratoeira-splash-style");
						if (pre) pre.remove();
						if (preStyle) preStyle.remove();
					} catch (e) {}
					preRemovedRef.current = true;
				}

				if (next >= 100) {
					clearInterval(interval);
					// ensure it's exactly 100
					setTimeout(() => setPercent(100), 0);
					// restore overflow when we hit 100%
					try {
						if (prevOverflowRef.current) {
							document.documentElement.style.overflowY = prevOverflowRef.current.html || "";
							document.body.style.overflowY = prevOverflowRef.current.body || "";
							// clear stored value
							prevOverflowRef.current = null;
						}
					} catch (e) {
						// ignore
					}
					// ensure pre elements removed and hide splash after the circle expands
					// hide the splash after the circle expands
					setTimeout(() => {
						try {
							localStorage.setItem("ratoeira_splash_seen", "1");
						} catch (e) {
							// ignore
						}
						// ensure pre elements removed
						try {
							const pre = document.getElementById("ratoeira-splash-pre");
							const preStyle = document.getElementById("ratoeira-splash-style");
							if (pre) pre.remove();
							if (preStyle) preStyle.remove();
						} catch (e) {}

						setVisible(false);
					}, 900);
				}

				// trigger the circle slightly earlier: show it once we reach 99%
				if (next >= 99 && !circleTriggeredRef.current.triggered) {
					circleTriggeredRef.current.triggered = true;
					// keep a short delay to allow the percent to render at 99 before expanding
					setTimeout(() => setCircle(true), 300);
				}

				if (next >= 97 && !circleTriggeredRef.current.triggered) {
					setVisibleCircle(true);
				}

				return next;
			});
		}, 20);

		return () => clearInterval(interval);
	}, []);

	if (!visible) return null;

	return (
		<div
			aria-hidden
			className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-700 text-black "
		>
			<div className="relative flex items-center justify-center glitch">
				<div
					className="lg:text-8xl sm:text-6xl font-vtks select-none z-10 glitch-text"
					data-text={percent + "%"}
				>
					{percent}%
				</div>

				{/* expanding black circle: use a centered square element with border-radius:50% so it stays a circle
					Animate width/height (slower) so the disk shape is visible while growing. */}
				<div className="absolute inset-0 pointer-events-none">
					<div
						aria-hidden
						style={{
							position: "absolute",
							left: "50%",
							top: "50%",
							transform: "translate(-50%, -50%)",
							width: circle ? "180vmax" : "2vmax",
							height: circle ? "180vmax" : "2vmax",
							background: "black",
							borderRadius: "50%",
							transition: "width 1100ms ease-in-out, height 1100ms ease-in-out",
							willChange: "width, height",
							zIndex: 1,
							display: visibleCircle ? "block" : "none",
						}}
					/>
				</div>
			</div>
		</div>
	);
}
