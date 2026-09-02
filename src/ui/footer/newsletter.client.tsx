"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { signForNewsletter } from "@/ui/footer/actions";

type NewsletterProps = {
	placeholder?: string;
	buttonLabel?: string;
};

export function Newsletter({ placeholder, buttonLabel }: NewsletterProps) {
	const [loading, setLoading] = useState(false);

	return (
		<form
			className="flex gap-2"
			onSubmit={() => {
				setLoading(true);
			}}
			action={async (formData) => {
				try {
					const result = await signForNewsletter(formData);
					if (result?.status && result.status < 400) {
						toast.info("Inscrição enviada.", { position: "bottom-left" });
					} else {
						toast.error("Não foi possível assinar a newsletter agora.", { position: "bottom-left" });
					}
				} catch {
					toast.error("Não foi possível assinar a newsletter agora.", { position: "bottom-left" });
				} finally {
					setLoading(false);
				}
			}}
		>
			<input
				className="sl-field flex-1 bg-[color:var(--sl-surface-card)] text-[14px] outline-none placeholder:text-[color:var(--sl-text-disabled)]"
				placeholder={placeholder || "seu@email.com"}
				type="email"
				name="email"
				required
			/>
			<button
				type="submit"
				className="sl-btn sl-btn-primary"
				style={{ height: "var(--sl-h-field)", paddingInline: "18px" }}
				disabled={loading}
			>
				{loading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : buttonLabel || "Assinar"}
			</button>
		</form>
	);
}
