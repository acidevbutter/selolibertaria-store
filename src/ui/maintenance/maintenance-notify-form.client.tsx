"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { signForNewsletter } from "@/ui/footer/actions";

export function MaintenanceNotifyForm({
	placeholder,
	buttonLabel,
	noSpamLabel,
}: {
	placeholder: string;
	buttonLabel: string;
	noSpamLabel: string;
}) {
	const [loading, setLoading] = useState(false);

	return (
		<form
			className="flex flex-wrap items-center gap-[10px]"
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
				type="email"
				name="email"
				required
				placeholder={placeholder}
				className="h-11 min-w-[170px] flex-1 border border-[color:rgba(247,244,239,0.3)] bg-[#0B0B0B] px-[14px] text-[14px] tracking-[0.04em] text-[#F7F4EF] outline-none"
			/>
			<button
				type="submit"
				disabled={loading}
				className="flex h-11 items-center justify-center whitespace-nowrap bg-[#F2891E] px-5 text-[10px] font-black uppercase tracking-[0.22em] text-[#0B0B0B] disabled:opacity-60"
			>
				{loading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : buttonLabel}
			</button>
			<span className="whitespace-nowrap text-[11px] tracking-[0.06em] text-[color:rgba(247,244,239,0.62)]">
				{noSpamLabel}
			</span>
		</form>
	);
}
