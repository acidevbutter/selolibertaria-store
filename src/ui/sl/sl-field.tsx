import { type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

type SlFieldState = "default" | "error";

/**
 * The system's single field — 52px, label always visible above (never
 * placeholder-as-label). An error state always carries a `hint` with an exit
 * action (an error with no way out is forbidden). `suffix` takes a card brand,
 * a CVV "?", or a glued button (Calcular / Aplicar).
 */
export function SlField({
	label,
	hint,
	state = "default",
	suffix,
	className,
	id,
	...inputProps
}: {
	label: ReactNode;
	hint?: ReactNode;
	state?: SlFieldState;
	suffix?: ReactNode;
	className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">) {
	const autoId = useId();
	const fieldId = id ?? autoId;
	const isError = state === "error";

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<label htmlFor={fieldId} className="sl-lbl" style={isError ? { color: "var(--sl-danger)" } : undefined}>
				{label}
			</label>
			<div
				className="sl-field gap-2"
				style={isError ? { borderColor: "var(--sl-danger)", background: "var(--sl-danger-wash)" } : undefined}
			>
				<input
					id={fieldId}
					className="min-w-0 flex-1 border-0 bg-transparent text-[16px] outline-none placeholder:text-[color:var(--sl-text-disabled)]"
					style={isError ? { color: "var(--sl-danger)" } : undefined}
					aria-invalid={isError || undefined}
					aria-describedby={hint ? `${fieldId}-hint` : undefined}
					{...inputProps}
				/>
				{suffix ? <span className="flex shrink-0 items-center">{suffix}</span> : null}
			</div>
			{hint ? (
				<p
					id={`${fieldId}-hint`}
					className="m-0 text-[13px] leading-[1.5]"
					style={{ color: isError ? "var(--sl-danger)" : "var(--sl-text-soft)" }}
				>
					{hint}
				</p>
			) : null}
		</div>
	);
}
