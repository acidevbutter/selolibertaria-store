// Local replacement types for the previous commerce-kit dependency.
// These are intentionally minimal and only cover the surface actually used in the app.

export interface AppliedPromotion {
	promotionId?: string | null;
	label: string;
	kind: "automatic" | "coupon";
	code?: string | null;
	discountAmount: number;
	currency: string;
}

export interface PricePresentation {
	basePrice: number;
	effectivePrice: number;
	discountAmount: number;
	compareAtPrice?: number | null;
	promotionLabel?: string | null;
	promotionId?: string | null;
}

export interface ProductVariant {
	id: string;
	price: number; // minor units (Stripe unit_amount)
	currency: string;
	priceId?: string | null;
	label?: string | null;
	slug?: string | null;
	productId?: string;
	description?: string | null;
	images?: string[];
	stock?: number | null;
	pricing?: PricePresentation;
	appliedPromotions?: AppliedPromotion[];
}

export interface CategoryRef {
	slug: string;
	name?: string;
}

export interface ProductInfo {
	id: string;
	name: string;
	images: string[];
	summary?: string | null;
}

export interface Product extends ProductInfo {
	slug: string; // derived from Stripe product metadata.slug OR product.id
	price: number; // minor units
	currency: string; // ISO code
	stock?: number | null; // from metadata or default
	variants?: ProductVariant[]; // optional convenience
	category?: CategoryRef | null; // from metadata.category maybe
	pricing?: PricePresentation;
	appliedPromotions?: AppliedPromotion[];
}

// YnsProduct previously extended Product with a few additional optional fields.
// We keep a similar structure so existing casts keep working.
export interface YnsProduct extends Product {
	variants: ProductVariant[]; // ensure at least one variant
	category?: CategoryRef | null;
}

export interface CartItem {
	id: string; // internal cart line id (variantId)
	productId: string;
	variantId: string; // mirrors product/variant id
	quantity: number;
	price: number; // minor units (unit price *per* item)
	product?: ProductInfo; // lightweight product snapshot for UI
	basePrice?: number;
	finalPrice?: number;
	lineBaseTotal?: number;
	lineDiscountTotal?: number;
	lineFinalTotal?: number;
	appliedPromotions?: AppliedPromotion[];
}

export interface Cart {
	id: string;
	items: CartItem[];
	total: number; // minor units (sum of line.price * quantity)
	currency: string; // single currency per cart
	subtotal?: number;
	discountTotal?: number;
	couponCode?: string | null;
	couponError?: string | null;
	appliedPromotions?: AppliedPromotion[];
	shippingRate?: {
		providerCode: string;
		providerLabel: string;
		serviceCode: string;
		serviceName: string;
		fixed_amount: { amount: number };
		currency?: string;
		estimated_days?: number | null;
	} | null;
	shippingError?: string | null;
}

export type BrowseResult<T> = { data: T[] };
