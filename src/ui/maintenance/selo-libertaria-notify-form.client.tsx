"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { signForNewsletter } from "@/ui/footer/actions";

/** Same paper-surface notify form as the "Em Construção — Selo Libertária" design, using the sl-* field/button tokens. */
export function SeloLibertariaNotifyForm({
	label,
	placeholder,
	buttonLabel,
	noSpamLabel,
}: {
	label: string;
	placeholder: string;
	buttonLabel: string;
	noSpamLabel: string;
}) {
	const [loading, setLoading] = useState(false);

	return (
		<div className="flex max-w-[440px] flex-col gap-[10px]">
			<label htmlFor="sl-wip-mail" className="sl-lbl">
				{label}
			</label>
			<form
				className="flex flex-wrap gap-[10px]"
				onSubmit={() => setLoading(true)}
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
					id="sl-wip-mail"
					type="email"
					name="email"
					required
					placeholder={placeholder}
					className="sl-field min-w-[190px] flex-1 text-[16px] outline-none placeholder:text-[color:var(--sl-text-disabled)]"
				/>
				<button
					type="submit"
					disabled={loading}
					className="sl-btn sl-btn-buy flex-none disabled:opacity-60"
					style={{ height: "var(--sl-h-field)" }}
				>
					{loading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : buttonLabel}
				</button>
			</form>
			<p className="m-0 text-[13px] leading-[1.7] text-[color:var(--sl-text-soft)]">{noSpamLabel}</p>
		</div>
	);
}
