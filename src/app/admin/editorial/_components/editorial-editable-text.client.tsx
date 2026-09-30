"use client";

import type { ClipboardEvent, HTMLAttributes } from "react";
import { useLayoutEffect, useRef, useState } from "react";

type EditableTextProps = Omit<HTMLAttributes<HTMLElement>, "onInput" | "onPaste" | "children"> & {
	/** Current text according to the document state. */
	value: string;
	/** Called with the element's plain text on every keystroke. */
	onValueChange: (value: string) => void;
	as?: "div" | "span";
	placeholder?: string;
};

function pastePlainText(event: ClipboardEvent<HTMLElement>) {
	event.preventDefault();
	document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
}

/**
 * A plain-text `contentEditable` that never fights the caret.
 *
 * Rendering `{value}` as the children of a controlled `contentEditable` makes
 * React rewrite the text node after every keystroke, which resets the caret to
 * the start of the field -- so whatever the editor types comes out reversed.
 * Here React only ever renders the *initial* text; afterwards the DOM belongs
 * to the browser while the user types, and `value` is pushed into the DOM only
 * when it differs from what is already there (undo/redo, a "/" shortcut, a
 * mark applied from the toolbar), which is the one case where the caret jump
 * is unavoidable.
 */
export function EditableText({
	value,
	onValueChange,
	as: Tag = "div",
	placeholder,
	...rest
}: EditableTextProps) {
	const ref = useRef<HTMLElement>(null);
	const [initialValue] = useState(value);

	useLayoutEffect(() => {
		const element = ref.current;
		if (element && element.textContent !== value) element.textContent = value;
	}, [value]);

	return (
		<Tag
			{...rest}
			ref={ref as never}
			contentEditable
			suppressContentEditableWarning
			role="textbox"
			tabIndex={0}
			aria-label={rest["aria-label"] ?? placeholder}
			data-placeholder={placeholder}
			onInput={(event) => onValueChange(event.currentTarget.textContent ?? "")}
			onPaste={pastePlainText}
		>
			{initialValue}
		</Tag>
	);
}
