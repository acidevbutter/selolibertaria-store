"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FavoriteToggleProps {
	productSlug: string;
	variantId?: string | null;
	initialActive?: boolean;
	className?: string;
}

export function FavoriteToggle({
	productSlug,
	variantId,
	initialActive = false,
	className,
}: FavoriteToggleProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [active, setActive] = useState(initialActive);
	const [loading, setLoading] = useState(false);

	async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		event.preventDefault();
		event.stopPropagation();
		if (loading) return;
		setLoading(true);
		try {
			const response = await fetch("/api/user/favorites", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productSlug, variantId }),
			});
			if (response.status === 401) {
				const next = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
				router.push(`/login?next=${encodeURIComponent(next)}`);
				return;
			}
			if (!response.ok) {
				throw new Error("Failed to update favorite");
			}
			const payload = (await response.json()) as { active?: boolean };
			setActive(Boolean(payload.active));
			router.refresh();
		} catch (error) {
			console.error("[favorite toggle]", error);
		} finally {
			setLoading(false);
		}
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-pressed={active}
			aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
			className={cn(
				"inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm transition-colors hover:border-red-500 hover:text-red-600",
				active && "border-red-500 text-red-600",
				className,
			)}
		>
			<Heart className={cn("h-4 w-4", active && "fill-current")} />
		</button>
	);
}
