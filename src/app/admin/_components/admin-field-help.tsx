"use client";

import { CircleHelp } from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/shadcn/popover";

export function AdminFieldHelp({ label, children }: { label: string; children: string }) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-5 w-5"
					aria-label={`Ajuda sobre ${label}`}
				>
					<CircleHelp className="h-3.5 w-3.5" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="text-sm leading-6">
				{children}
			</PopoverContent>
		</Popover>
	);
}
