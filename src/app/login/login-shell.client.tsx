"use client";

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

	const date = new Date();

	return (
		<div className="min-h-svh overflow-x-hidden bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)]">
			<main className="w-full">
				<section className="grid border-b border-[color:var(--editorial-border)] lg:grid-cols-[48.5%_51.5%]">
					<div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-18 lg:py-18">
						<div className="max-w-[36rem] space-y-8">
							<div className="space-y-4">
								<h1 className="max-w-[10ch] text-5xl font-black sm:text-6xl xl:text-[5.5rem]">
									{t("hero.titleLine1")} <br />
									{t("hero.titleLine2")}
								</h1>
								<p className="max-w-[27rem] text-base leading-8 text-[color:var(--editorial-muted)] sm:text-[1.05rem]">
									{t("hero.description")}
								</p>
							</div>

							<LoginForm
								defaultCountry={defaultCountry}
								defaultCurrency={defaultCurrency}
								providers={providers}
							/>

							{flash ? (
								<div className="max-w-[30rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
									{flash}
								</div>
							) : null}
						</div>
					</div>

					<aside className="relative overflow-hidden bg-[color:var(--editorial-ink)] px-6 py-10 text-[color:var(--editorial-paper)] sm:px-10 sm:py-12 lg:min-h-[880px] lg:px-16 lg:py-16">
						<div className="flex h-full flex-col justify-between">
							<div className="flex justify-center">
								<div className="relative w-full max-w-[620px]">
									<div className="relative aspect-[0.84] overflow-hidden">
										<Image
											src="/images/ninfas-example.png"
											alt={t("hero.coverAlt")}
											fill
											className="object-contain"
											sizes="(min-width: 1024px) 45vw, 100vw"
											priority
										/>
									</div>
									<div className="absolute bottom-0 right-0 w-[66%] bg-[color:var(--editorial-paper)] px-6 py-6 text-[color:var(--editorial-ink)] shadow-[0_18px_48px_-30px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7">
										<p className="text-5xl leading-none text-[color:var(--editorial-accent)]">“</p>
										<p className="mt-2 text-[2rem] leading-[0.95] font-black tracking-[-0.05em] sm:text-[2.4rem]">
											Se te começo,
											<br />
											logo me despeço.
										</p>
										<div className="mt-5 h-px w-14 bg-[color:var(--editorial-accent)]" />
										<p className="mt-3 text-sm text-[color:var(--editorial-muted)]">Ninfas do Tiete</p>
									</div>
								</div>
							</div>
						</div>
					</aside>
				</section>

				<footer className="mx-4 w-auto overflow-x-hidden flex flex-col gap-5 py-5 text-sm text-[color:var(--editorial-muted)] sm:mx-6 lg:mx-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-2">
						<span>{t("footer.rights", { year: date.getFullYear() })}</span>
						<span className="text-[color:var(--editorial-border)]">|</span>
						<Link
							href="https://devbutter.tech"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
						>
							<Image
								src="/images/icons/devbutter.svg"
								alt=""
								aria-hidden="true"
								width={18}
								height={18}
								className="h-[18px] w-[18px]"
							/>
							<span className="font-medium">devbutter</span>
						</Link>
					</div>

					<div className="hidden h-8 w-px bg-[color:var(--editorial-border)] lg:block" />

					<p className="price-font text-lg italic text-[color:var(--editorial-accent)]">
						{t("footer.tagline")}
					</p>

					<div className="hidden h-8 w-px bg-[color:var(--editorial-border)] lg:block" />

					<nav className="flex flex-wrap items-center gap-x-8 gap-y-2 lg:justify-end">
						<Link href="/privacy" className="transition-colors hover:text-[color:var(--editorial-ink)]">
							{t("footer.privacy")}
						</Link>
						<Link href="/terms" className="transition-colors hover:text-[color:var(--editorial-ink)]">
							{t("footer.terms")}
						</Link>
						<Link href="/contact" className="transition-colors hover:text-[color:var(--editorial-ink)]">
							{t("footer.contact")}
						</Link>
					</nav>
				</footer>
			</main>
		</div>
	);
}
