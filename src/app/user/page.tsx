import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordResetMenuButton } from "@/app/user/password-reset-menu-button.client";
import { Button } from "@/components/ui/button";
import { env } from "@/env.mjs";
import { getLocale, getTranslations } from "@/i18n/server";
import { auth, logout } from "@/lib/auth";
import { getDefaultCurrencyForLocale } from "@/lib/currency";
import { getFavoriteViewModels } from "@/lib/favorites";
import { getDefaultCountrySetting } from "@/lib/settings-store";
import { formatMoney } from "@/lib/utils";
import { FavoriteToggle } from "@/ui/favorites/favorite-toggle.client";
import { ProfileEditor } from "@/ui/profile-editor.client";
import { PurchasesGrid } from "@/ui/purchases-grid.client";

export const dynamic = "force-dynamic"; // ensures cookie revalidation

type UserPageSearchParams = {
	section?: string;
	order?: string;
	setupPassword?: string;
	pendingPayment?: string;
};

export default async function UserPage({ searchParams }: { searchParams?: Promise<UserPageSearchParams> }) {
	const resolvedSearchParams = (searchParams ? await searchParams : {}) as UserPageSearchParams;
	const session = await auth();
	if (!session) return redirect("/login");
	const { user } = session;
	const [locale, t] = await Promise.all([getLocale(), getTranslations("Account")]);
	const section = (resolvedSearchParams.section || "overview") as
		| "overview"
		| "profile"
		| "favorites"
		| "purchases";
	const defaultCountry = section === "profile" ? await getDefaultCountrySetting(locale) : "BR";
	const defaultCurrency = getDefaultCurrencyForLocale(locale);

	interface FullUserDoc {
		_id: string;
		email: string;
		name?: string;
		phone?: string;
		cpf?: string;
		preferredCurrency?: "USD" | "BRL" | "EUR";
		phoneDetails?: {
			country?: string;
			dialCode?: string;
			national?: string;
			display?: string;
		};
		address?: {
			line1?: string;
			line2?: string;
			number?: string;
			complement?: string;
			district?: string;
			city?: string;
			state?: string;
			postalCode?: string;
			country?: string;
		};
		marketing?: {
			email?: {
				optIn?: boolean;
			};
		};
	}
	let fullUser: FullUserDoc | null = null;
	if (section === "profile") {
		try {
			const token = (await cookies()).get("session")?.value;
			const response = token
				? await fetch(`${env.FASTAPI_API_URL}/users/${encodeURIComponent(user.id)}`, {
						headers: { authorization: `Bearer ${token}` },
						cache: "no-store",
					})
				: null;
			if (response?.ok) {
				const remote = (await response.json()) as Record<string, unknown>;
				fullUser = {
					_id: user.id,
					email: String(remote.email ?? user.email),
					name: typeof remote.name === "string" ? remote.name : undefined,
					phone: typeof remote.phone === "string" ? remote.phone : undefined,
					cpf: typeof remote.cpf === "string" ? remote.cpf : undefined,
					preferredCurrency:
						typeof remote.preferred_currency === "string"
							? (remote.preferred_currency as FullUserDoc["preferredCurrency"])
							: undefined,
					phoneDetails: {
						country: remote.phone_country as string | undefined,
						dialCode: remote.phone_dial_code as string | undefined,
						national: remote.phone_national as string | undefined,
						display: remote.phone_display as string | undefined,
					},
					address: {
						line1: remote.address_line1 as string | undefined,
						line2: remote.address_line2 as string | undefined,
						number: remote.address_number as string | undefined,
						complement: remote.address_complement as string | undefined,
						district: remote.address_district as string | undefined,
						city: remote.address_city as string | undefined,
						state: remote.address_state as string | undefined,
						postalCode: remote.address_postal_code as string | undefined,
						country: remote.address_country as string | undefined,
					},
					marketing: { email: { optIn: remote.marketing_email_opt_in as boolean | undefined } },
				};
			}
		} catch (e) {
			console.error("[user/page] Failed to load full user data", e);
		}
	}

	let purchases: Array<{
		id: string;
		createdAt: Date;
		status: string;
		amountTotal: number;
		currency: string;
		items: Array<{
			name?: string | null;
			quantity: number;
			unitAmount?: number | null;
			priceId?: string | null;
		}>;
		fulfillment?: {
			status?: "received" | "producing" | "shipped";
			trackingNumber?: string | null;
		};
	}> | null = null;
	let favorites: Awaited<ReturnType<typeof getFavoriteViewModels>> | null = null;
	if (section === "purchases") {
		try {
			const token = (await cookies()).get("session")?.value;
			const response = token
				? await fetch(`${env.FASTAPI_API_URL}/orders/me?page=1&page_size=100`, {
						headers: { authorization: `Bearer ${token}` },
						cache: "no-store",
					})
				: null;
			if (response?.ok) {
				const payload = (await response.json()) as {
					items?: Array<{
						id: string;
						created_at: string;
						status: string;
						amount_total: number;
						currency: string;
						items?: Array<{
							name?: string | null;
							quantity: number;
							unit_amount?: number | null;
							price_id?: string | null;
						}>;
						fulfillment_status?: "received" | "producing" | "shipped";
						tracking_number?: string | null;
					}>;
				};
				purchases = (payload.items ?? []).map((order) => ({
					id: order.id,
					createdAt: new Date(order.created_at),
					status: order.status,
					amountTotal: order.amount_total,
					currency: order.currency,
					items: (order.items ?? []).map((item) => ({
						name: item.name,
						quantity: item.quantity,
						unitAmount: item.unit_amount,
						priceId: item.price_id,
					})),
					fulfillment: { status: order.fulfillment_status, trackingNumber: order.tracking_number },
				}));
			}
		} catch (e) {
			console.error("[user/page] load purchases error", e);
		}
	}
	if (section === "favorites") {
		try {
			favorites = await getFavoriteViewModels(user.id);
		} catch (error) {
			console.error("[user/page] load favorites error", error);
		}
	}

	function renderContent() {
		switch (section) {
			case "profile": {
				const initial = {
					_id: user.id,
					name: fullUser?.name ?? user.name ?? undefined,
					email: fullUser?.email ?? user.email,
					phone: fullUser?.phone,
					cpf: fullUser?.cpf,
					preferredCurrency: fullUser?.preferredCurrency ?? defaultCurrency,
					phoneDetails: fullUser?.phoneDetails,
					address: fullUser?.address,
					marketing: fullUser?.marketing,
				};
				return (
					<ProfileEditor
						defaultCountry={defaultCountry}
						defaultCurrency={defaultCurrency}
						userId={user.id}
						initial={initial}
					/>
				);
			}
			case "favorites": {
				return (
					<div className="space-y-6">
						<div className="space-y-2">
							<h2 className="text-2xl font-semibold tracking-tight">{t("favorites.title")}</h2>
							<p className="text-sm text-muted-foreground">{t("favorites.description")}</p>
						</div>
						{!favorites || favorites.length === 0 ? (
							<div className="rounded-lg border border-dashed p-10 text-center">
								<p className="text-sm text-muted-foreground">{t("favorites.empty")}</p>
							</div>
						) : (
							<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
								{favorites.map((favorite) => {
									const product = favorite.product;
									const variant =
										product?.variants?.find((entry) => entry.id === favorite.variantId) ??
										product?.variants?.[0];
									const effectivePrice = variant?.pricing?.effectivePrice ?? variant?.price ?? product?.price;
									const basePrice = variant?.pricing?.basePrice ?? effectivePrice;
									const currency = variant?.currency ?? product?.currency ?? "USD";
									return (
										<div key={favorite.id} className="rounded-xl border bg-card p-4">
											<div className="flex items-start justify-between gap-3">
												<div className="space-y-1">
													<Link
														href={`/product/${favorite.productSlug}`}
														className="font-semibold hover:underline"
													>
														{favorite.name}
													</Link>
													{favorite.variantLabel ? (
														<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
															{favorite.variantLabel}
														</p>
													) : null}
												</div>
												<FavoriteToggle
													productSlug={favorite.productSlug}
													variantId={favorite.variantId ?? null}
													initialActive
												/>
											</div>
											<div className="mt-4 space-y-1">
												{typeof effectivePrice === "number" ? (
													<p className="text-lg font-semibold">
														{formatMoney({
															amount: effectivePrice,
															currency,
															locale,
														})}
													</p>
												) : (
													<p className="text-sm text-muted-foreground">{t("favorites.priceUnavailable")}</p>
												)}
												{typeof effectivePrice === "number" &&
												typeof basePrice === "number" &&
												basePrice > effectivePrice ? (
													<p className="text-sm text-muted-foreground line-through">
														{formatMoney({
															amount: basePrice,
															currency,
															locale,
														})}
													</p>
												) : null}
											</div>
											<div className="mt-4">
												<Link
													href={`/product/${favorite.productSlug}${favorite.variantId ? `?variant=${encodeURIComponent(favorite.variantId)}` : ""}`}
													className="text-sm font-medium underline"
												>
													{t("favorites.viewProduct")}
												</Link>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				);
			}
			case "purchases": {
				return (
					<div className="space-y-6">
						<div className="flex items-center justify-between gap-4 flex-wrap">
							<h2 className="text-2xl font-semibold tracking-tight">{t("purchases.title")}</h2>
						</div>
						{resolvedSearchParams.setupPassword === "1" ? (
							<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
								<p className="font-medium">Crie sua senha para acessar sua conta quando quiser.</p>
								<p className="mt-1 text-amber-800">
									Seu pedido já está disponível e você pode definir a senha no primeiro acesso.
								</p>
								<div className="mt-3">
									<Button asChild>
										<Link
											href={`/api/auth/password-setup?next=${encodeURIComponent(`/user?section=purchases${resolvedSearchParams.order ? `&order=${resolvedSearchParams.order}` : ""}`)}`}
										>
											Criar senha agora
										</Link>
									</Button>
								</div>
							</div>
						) : null}
						{resolvedSearchParams.pendingPayment === "1" ? (
							<div
								className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
								role="status"
							>
								<p className="font-medium">Pagamento Pix em confirmação.</p>
								<p className="mt-1 text-amber-800">
									Seu pedido ficará disponível aqui assim que a Asaas confirmar o pagamento.
								</p>
							</div>
						) : null}
						{!purchases || purchases.length === 0 ? (
							<div className="rounded-lg border border-dashed p-10 text-center">
								<p className="text-sm text-muted-foreground">{t("purchases.empty")}</p>
							</div>
						) : (
							<PurchasesGrid purchases={purchases} initialOpenPurchaseId={resolvedSearchParams.order} />
						)}
					</div>
				);
			}
			case "overview":
			default:
				return (
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">{t("overview.title")}</h2>
						<p className="text-sm text-muted-foreground">{t("overview.description")}</p>
					</div>
				);
		}
	}

	const navItems: { key: typeof section; label: string }[] = [
		{ key: "overview", label: t("nav.overview") },
		{ key: "profile", label: t("nav.profile") },
		{ key: "favorites", label: t("nav.favorites") },
		{ key: "purchases", label: t("nav.purchases") },
	];

	return (
		<div className="max-w-7xl mx-auto py-10 px-4 grid gap-8 grid-cols-[14rem_1fr] min-h-screen">
			{/* Sidebar */}
			<aside className="w-56 shrink-0 space-y-6 sticky top-20 self-start h-max">
				<div className="space-y-1">
					<h1 className="text-xl font-bold">{t("title")}</h1>
					<p className="text-xs text-muted-foreground">{t("sessionExpiry")}</p>
				</div>
				<nav className="flex flex-col gap-1" aria-label={t("nav.label")}>
					{navItems.map((item) => {
						const active = item.key === section;
						return (
							<Link
								key={item.key}
								href={`/user?section=${item.key}`}
								aria-current={active ? "page" : undefined}
								className={`rounded-md px-3 py-2 text-sm font-medium border transition-colors hover:bg-accent hover:text-accent-foreground ${active ? "bg-accent border-accent" : "border-transparent"}`}
							>
								{item.label}
							</Link>
						);
					})}
				</nav>
				<div className="pt-4 space-y-2">
					<Link
						href="/"
						className="inline-flex w-full justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
					>
						{t("actions.backHome")}
					</Link>
					<PasswordResetMenuButton email={fullUser?.email ?? user.email} />
					<form action={logout}>
						<Button variant="outline" className="w-full" type="submit">
							{t("actions.logout")}
						</Button>
					</form>
				</div>
			</aside>

			{/* Main content */}
			<main className="w-200 space-y-8">{renderContent()}</main>
		</div>
	);
}
