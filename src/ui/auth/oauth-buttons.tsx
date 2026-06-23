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
		"border-[color:var(--editorial-border)] bg-transparent text-[color:var(--editorial-ink)] hover:border-[color:var(--editorial-ink)] hover:bg-transparent hover:text-[color:var(--editorial-ink)] focus-visible:ring-slate-300/70",
	facebook:
		"border-[color:var(--editorial-border)] bg-transparent text-[color:var(--editorial-ink)] hover:border-[color:var(--editorial-ink)] hover:bg-transparent hover:text-[color:var(--editorial-ink)] focus-visible:ring-[#1877F2]/25",
	instagram:
		"border-[color:var(--editorial-border)] bg-transparent text-[color:var(--editorial-ink)] hover:border-[color:var(--editorial-ink)] hover:bg-transparent hover:text-[color:var(--editorial-ink)] focus-visible:ring-[#E1306C]/25",
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
		<div className="grid w-full gap-3">
			<div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
				<span className="h-px flex-1 bg-[color:var(--editorial-border)]" />
				<span>{t("divider")}</span>
				<span className="h-px flex-1 bg-[color:var(--editorial-border)]" />
			</div>
			<div className="grid gap-2.5">
				{providers.map((provider) => (
					<Button
						key={provider.id}
						asChild
						variant="outline"
						className={[
							"group h-11 w-full rounded-none border-[color:var(--editorial-border)] px-3 shadow-none transition-colors duration-200 hover:-translate-y-0 hover:shadow-none",
							providerButtonClassMap[provider.id] ??
								"border-[color:var(--editorial-border)] bg-transparent text-[color:var(--editorial-ink)] hover:bg-transparent",
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
