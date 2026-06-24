"use client";

import type * as React from "react";
import { Input } from "@/ui/shadcn/input";

function formatSlugToKebab(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function formatSlugWhileTyping(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+/, "");
}

export function EditorialSlugInput(props: React.ComponentProps<typeof Input>) {
	return (
		<Input
			{...props}
			autoCapitalize="none"
			autoCorrect="off"
			spellCheck={false}
			onInput={(event) => {
				event.currentTarget.value = formatSlugWhileTyping(event.currentTarget.value);
				props.onInput?.(event);
			}}
			onBlur={(event) => {
				event.currentTarget.value = formatSlugToKebab(event.currentTarget.value);
				props.onBlur?.(event);
			}}
		/>
	);
}
