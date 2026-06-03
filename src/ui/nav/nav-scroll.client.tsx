"use client";

import { useEffect } from "react";

export default function NavScroll() {
	useEffect(() => {
		const header = document.querySelector("header.nav-border-reveal");
		if (!header) return;

		const onScroll = () => {
			if (window.scrollY > 10) {
				header.classList.add("scrolled");
			} else {
				header.classList.remove("scrolled");
			}
		};

		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return null;
}
