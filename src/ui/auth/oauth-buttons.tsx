"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/client";
import type { OAuthProviderId } from "@/lib/oauth/catalog";

type ProviderLink = {
	id: OAuthProviderId;
	label: string;
	href: string;
};

type Props = {
	providers: ProviderLink[];
};

const providerIconMap: Partial<Record<OAuthProviderId, string>> = {
	google: "/images/icons/google.svg",
	facebook: "/images/icons/facebook.svg",
	instagram: "/images/icons/instagram.svg",
};

const providerButtonClassMap: Partial<Record<OAuthProviderId, string>> = {
	google:
		"border-[#d9dce1] bg-white text-slate-900 hover:border-[#c7ccd3] hover:bg-white hover:text-slate-900 focus-visible:ring-slate-300/70",
	facebook:
		"border-border/80 bg-card/85 text-foreground hover:border-[#1877F2]/35 hover:bg-card hover:text-foreground focus-visible:ring-[#1877F2]/25",
	instagram:
		"border-border/80 bg-card/85 text-foreground hover:border-[#E1306C]/30 hover:bg-card hover:text-foreground focus-visible:ring-[#E1306C]/25",
};

const providerBadgeClassMap: Partial<Record<OAuthProviderId, string>> = {
	google: "bg-white",
	facebook: "bg-[#1877F2]/10",
	instagram: "bg-[#E1306C]/10",
};

export function OAuthButtons({ providers }: Props) {
	const t = useTranslations("Login.oauthButtons");

	if (providers.length === 0) return null;

	return (
		<div className="mx-auto grid w-full max-w-[22rem] gap-3">
			<div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
				<span className="h-px flex-1 bg-border/70" />
				<span className="rounded-full border border-border/60 bg-card px-3 py-1">{t("divider")}</span>
				<span className="h-px flex-1 bg-border/70" />
			</div>
			<div className="grid gap-2.5">
				{providers.map((provider) => (
					<Button
						key={provider.id}
						asChild
						variant="outline"
						className={[
							"group h-11 w-full rounded-xl px-3 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-18px_rgba(15,23,42,0.48)]",
							providerButtonClassMap[provider.id] ??
								"border-border/80 bg-card/85 text-foreground hover:bg-card",
						].join(" ")}
					>
						<a href={provider.href}>
							<span className="grid w-full grid-cols-[1.75rem_1fr_1.75rem] items-center gap-3">
								<span
									className={[
										"flex h-7 w-7 items-center justify-center rounded-full border border-border/50 shadow-xs",
										providerBadgeClassMap[provider.id] ?? "bg-background",
									].join(" ")}
									aria-hidden="true"
								>
									{providerIconMap[provider.id] ? (
										<img
											src={providerIconMap[provider.id]}
											alt=""
											aria-hidden="true"
											className="h-[18px] w-[18px] shrink-0"
										/>
									) : null}
								</span>
								<span className="text-center text-sm font-medium tracking-[0.01em]">
									{t("continueWith", { provider: provider.label })}
								</span>
								<span aria-hidden="true" className="block h-[18px] w-[18px]" />
							</span>
						</a>
					</Button>
				))}
			</div>
		</div>
	);
}
