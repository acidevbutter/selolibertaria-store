"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

export function CategorySelectField({
	name = "category",
	categories,
	defaultValue = "",
	placeholder = "Select a category",
}: {
	name?: string;
	categories: Array<{ name: string; slug: string }>;
	defaultValue?: string;
	placeholder?: string;
}) {
	const [value, setValue] = useState(defaultValue);

	return (
		<>
			<input type="hidden" name={name} value={value} />
			<Select value={value} onValueChange={setValue}>
				<SelectTrigger>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{categories.map((category) => (
						<SelectItem key={category.slug} value={category.slug}>
							{category.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</>
	);
}
