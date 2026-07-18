import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordResetMenuButton } from "@/app/user/password-reset-menu-button.client";
import { Button } from "@/components/ui/button";
import { getLocale, getTranslations } from "@/i18n/server";
import { auth, logout } from "@/lib/auth";
import { getDefaultCurrencyForLocale } from "@/lib/currency";
import { getFavoriteViewModels } from "@/lib/favorites";
import { getDb } from "@/lib/mongodb";
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
		_id: ObjectId;
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
			const db = await getDb();
			fullUser = await db
				.collection<FullUserDoc>("users")
				.findOne({ _id: new ObjectId(user.id) }, { projection: { passwordHash: 0 } });
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
			const db = await getDb();
			const userDoc = await db
				.collection("users")
				.findOne<{ purchases?: typeof purchases }>(
					{ _id: new ObjectId(user.id) },
					{ projection: { purchases: 1 } },
				);
			purchases = (userDoc?.purchases || []).slice().reverse();
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
					name: fullUser?.name ?? user.name,
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
