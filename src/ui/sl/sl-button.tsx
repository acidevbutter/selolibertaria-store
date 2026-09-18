import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { YnsLink } from "@/ui/yns-link";

type SlVariant = "buy" | "primary" | "secondary" | "accent";
type SlSize = "buy" | "md" | "sm";

const variantClass: Record<SlVariant, string> = {
	buy: "sl-btn-buy",
	primary: "sl-btn-primary",
	secondary: "sl-btn-secondary",
	accent: "sl-btn-accent",
};

// Variant picks the skin (color/border); size independently overrides height/padding/font
// when a variant is used at a non-default height (e.g. an outlined button next to a 56px buy button).
const sizeStyle: Record<SlSize, React.CSSProperties> = {
	buy: { height: "var(--sl-h-buy)", padding: "var(--sl-pad-buy)", fontSize: "13px" },
	md: { height: "var(--sl-h-button)", padding: "var(--sl-pad-button)", fontSize: "11px" },
	sm: { height: "var(--sl-h-small)", padding: "0 16px", fontSize: "11px" },
};

type CommonProps = {
	variant?: SlVariant;
	/** Override this variant's default height (e.g. a secondary button beside a buy button). */
	size?: SlSize;
	/** Render for placement on an ink (black) surface. */
	onInk?: boolean;
	fullWidth?: boolean;
	className?: string;
	children: ReactNode;
};

type ButtonProps = CommonProps &
	Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & { href?: undefined };

type LinkProps = CommonProps &
	Omit<ComponentPropsWithoutRef<typeof YnsLink>, "className" | "children"> & { href: string };

export function SlButton(props: ButtonProps): React.JSX.Element;
export function SlButton(props: LinkProps): React.JSX.Element;
export function SlButton({
	variant = "primary",
	size,
	onInk = false,
	fullWidth = false,
	className,
	children,
	style,
	...rest
}: ButtonProps | LinkProps) {
	const classes = cn(
		"sl-btn gap-2",
		variantClass[variant],
		onInk && variant === "secondary" && "sl-btn-ink",
		fullWidth && "w-full",
		className,
	);
	const mergedStyle = size ? { ...sizeStyle[size], ...style } : style;

	if ("href" in rest && rest.href) {
		return (
			<YnsLink className={classes} style={mergedStyle} {...(rest as LinkProps)}>
				{children}
			</YnsLink>
		);
	}

	const { href: _href, ...buttonProps } = rest as ButtonProps & { href?: string };
	return (
		<button type={buttonProps.type ?? "button"} className={classes} style={mergedStyle} {...buttonProps}>
			{children}
		</button>
	);
}
