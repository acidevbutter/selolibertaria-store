"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
	children: ReactNode;
	className?: string;
	delay?: number;
	distance?: number;
	once?: boolean;
	amount?: number;
};

export function Reveal({
	children,
	className,
	delay = 0,
	distance = 24,
	once = true,
	amount = 0.2,
}: RevealProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			className={className}
			initial={prefersReducedMotion ? undefined : { opacity: 0, y: distance }}
			whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
			viewport={prefersReducedMotion ? undefined : { once, amount }}
			transition={prefersReducedMotion ? undefined : { duration: 0.7, delay, ease }}
		>
			{children}
		</motion.div>
	);
}

export function LiftOnHover({ children, className }: { children: ReactNode; className?: string }) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			className={cn("h-full", className)}
			whileHover={prefersReducedMotion ? undefined : { y: -6 }}
			transition={prefersReducedMotion ? undefined : { duration: 0.35, ease }}
		>
			{children}
		</motion.div>
	);
}
