"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "@/i18n/client";
import type { SupportedCurrency } from "@/lib/currency";
import { LoginForm } from "@/ui/login-form";

type ProviderLink = {
	id: "google" | "facebook" | "instagram";
	label: string;
	href: string;
};

type Props = {
	defaultCountry: string;
	defaultCurrency: SupportedCurrency;
	providers: ProviderLink[];
};

export default function LoginShell({ defaultCountry, defaultCurrency, providers }: Props) {
	const metadataT = useTranslations("Global.metadata");
	const t = useTranslations("Login");
	const params = useSearchParams();
	const [flash, setFlash] = useState<string | null>(null);

	useEffect(() => {
		if (params.get("reset") === "1") {
			setFlash(t("flash.passwordUpdated"));
			const tmo = setTimeout(() => setFlash(null), 5000);
			return () => clearTimeout(tmo);
		}
		return undefined;
	}, [params, t]);

	return (
		<div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background text-foreground p-6 md:p-10">
			<Link
				aria-label={t("actions.backToHomepage")}
				href="/"
				className="absolute left-4 top-4 md:left-8 md:top-8 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card/80 text-foreground shadow hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition"
			>
				<ArrowLeft className="h-5 w-5" />
				<span className="sr-only">{t("actions.back")}</span>
			</Link>

			<div className="flex w-full max-w-sm flex-col gap-6 md:max-w-4xl xl:max-w-5xl">
				<Link
					href="/"
					className="flex items-center gap-3 self-center text-3xl font-extrabold transition hover:opacity-90"
				>
					<div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-black/30 shadow-sm">
						<Image
							src="/images/selolibertaria.png"
							alt={metadataT("title")}
							width={64}
							height={64}
							className="h-14 w-14 object-contain"
						/>
					</div>
					<span className="text-4xl font-semibold tracking-tight text-foreground">{metadataT("title")}</span>
				</Link>
				<LoginForm defaultCountry={defaultCountry} defaultCurrency={defaultCurrency} providers={providers} />
				{flash && (
					<div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
						{flash}
					</div>
				)}
			</div>
		</div>
	);
}
