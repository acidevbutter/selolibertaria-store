import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { YnsLink } from "@/ui/yns-link";

type SlVariant = "buy" | "primary" | "secondary";

const variantClass: Record<SlVariant, string> = {
	buy: "sl-btn-buy",
	primary: "sl-btn-primary",
	secondary: "sl-btn-secondary",
};

type CommonProps = {
	variant?: SlVariant;
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
	onInk = false,
	fullWidth = false,
	className,
	children,
	...rest
}: ButtonProps | LinkProps) {
	const classes = cn(
		"sl-btn",
		variantClass[variant],
		onInk && variant === "secondary" && "sl-btn-ink",
		fullWidth && "w-full",
		className,
	);

	if ("href" in rest && rest.href) {
		return (
			<YnsLink className={classes} {...(rest as LinkProps)}>
				{children}
			</YnsLink>
		);
	}

	const buttonProps = rest as ButtonProps;
	return (
		<button type={buttonProps.type ?? "button"} className={classes} {...buttonProps}>
			{children}
		</button>
	);
}
