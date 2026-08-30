export type PromotionStatus = "draft" | "scheduled" | "active" | "paused" | "expired" | "archived";
export type PromotionKind = "automatic" | "coupon";
export type PromotionScope = "item" | "order";
export type PromotionBenefitType = "percentage_off" | "fixed_amount_off" | "fixed_price";
export type PromotionStackingMode = "exclusive" | "combine_with_automatic" | "combine_with_coupon";
