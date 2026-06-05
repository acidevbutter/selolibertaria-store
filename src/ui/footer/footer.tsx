import { getTranslations } from "@/i18n/server";
import { seloSiteMeta, seloSocialLinks } from "@/lib/selolibertaria-content";
import { getStripeCategories } from "@/lib/stripe-categories";
import FooterClient from "@/ui/footer/footer.client";

export async function Footer() {
	const year = new Date().getFullYear();
	const t = await getTranslations("Selo");
	const globalT = await getTranslations("Global.footer.links");

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

	return (
		<FooterClient
			newsletterTitle={t("footer.newsletterTitle")}
			paymentIcons={paymentIcons}
			year={year}
			socialLinks={seloSocialLinks}
			brandName={seloSiteMeta.name}
			brandEmail={seloSiteMeta.email}
			brandEyebrow={t("footer.eyebrow")}
			brandDescription={t("footer.description")}
			sections={[
				{
					header: t("footer.catalogue"),
					links: [
						{ label: t("footer.shop"), href: "/products" },
						...dynamicCategories.map(({ name, slug }) => ({ label: name, href: `/category/${slug}` })),
					],
				},
				{
					header: t("footer.editorial"),
					links: [
						{ label: t("footer.projects"), href: "/projects" },
						{ label: t("footer.events"), href: "/events" },
						{ label: t("nav.sarau"), href: "/sarau-safado" },
					],
				},
				{
					header: t("footer.support"),
					links: [
						{ label: t("footer.about"), href: "/about" },
						{ label: t("footer.contact"), href: "/contact" },
						{ label: t("footer.faq"), href: "/faq" },
						{ label: globalT("terms"), href: "/terms" },
						{ label: globalT("privacy"), href: "/privacy" },
					],
				},
			]}
			copyrightLabel={t("footer.allRightsReserved")}
			developedByLabel={t("footer.developedBy")}
			paymentMethodsLabel={t("footer.acceptedPayments")}
		/>
	);
}
