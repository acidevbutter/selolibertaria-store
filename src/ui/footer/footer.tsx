import { getTranslations } from "@/i18n/server";
import { getStripeCategories } from "@/lib/stripe-categories";
import FooterClient from "@/ui/footer/footer.client";

export async function Footer() {
	const t = await getTranslations("Global.footer");
	const year = new Date().getFullYear();

	const dynamicCategories = await getStripeCategories();

	const paymentIcons = [
		{ label: "Stripe", src: "/images/icons/stripe.svg" },
		{ label: "Visa", src: "/images/icons/visa.svg" },
		{ label: "Mastercard", src: "/images/icons/mastercard.svg" },
		{ label: "American Express", src: "/images/icons/amex.svg" },
		{ label: "Apple Pay", src: "/images/icons/apple-pay.svg" },
		{ label: "Google Pay", src: "/images/icons/google-pay.svg" },
		{ label: "Amazon Pay", src: "/images/icons/amazon-pay.svg" },
	];

	const newsletterTitle = t("newsletterTitle");

	return (
		<FooterClient
			newsletterTitle={newsletterTitle}
			paymentIcons={paymentIcons}
			dynamicCategories={dynamicCategories}
			year={year}
		/>
	);
}
