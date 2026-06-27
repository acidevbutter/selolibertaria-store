"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signForNewsletter } from "@/ui/footer/actions";

type NewsletterProps = {
	placeholder?: string;
	buttonLabel?: string;
};

export function Newsletter({ placeholder, buttonLabel }: NewsletterProps) {
	const [loading, setLoading] = useState(false);

	return (
		<form
			className="flex gap-x-2"
			onSubmit={() => {
				setLoading(true);
			}}
			action={async (formData) => {
				try {
					const result = await signForNewsletter(formData);

					if (result?.status && result.status < 400) {
						toast.info("Inscrição enviada.", { position: "bottom-left" });
					} else {
						toast.error("Não foi possível assinar a newsletter agora.", {
							position: "bottom-left",
						});
					}
				} catch {
					toast.error("Não foi possível assinar a newsletter agora.", {
						position: "bottom-left",
					});
				} finally {
					setLoading(false);
				}
			}}
		>
			<Input
				className="max-w-lg flex-1"
				placeholder={placeholder || "seu@email.com"}
				type="email"
				name="email"
				required
			/>
			<Button type="submit" className="w-24 rounded-full" variant="default" disabled={loading}>
				{loading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : buttonLabel || "Assinar"}
			</Button>
		</form>
	);
}
