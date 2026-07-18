import { getEditorialSiteGlobal } from "@/lib/editorial-content-store";
import { seloSiteMeta, seloSocialLinks } from "@/lib/selolibertaria-content";
import { getSupportEmailSetting } from "@/lib/settings-store";
import { getStripeCategories } from "@/lib/stripe-categories";
import FooterClient from "@/ui/footer/footer.client";

export async function Footer() {
	const year = new Date().getFullYear();
	const [globalContent, dynamicCategories, supportEmail] = await Promise.all([
		getEditorialSiteGlobal(),
		getStripeCategories(),
		getSupportEmailSetting(),
	]);

	const paymentIcons = [
		{ label: "Stripe", src: "/images/icons/stripe.svg" },
		{ label: "Visa", src: "/images/icons/visa.svg" },
		{ label: "Mastercard", src: "/images/icons/mastercard.svg" },
		{ label: "American Express", src: "/images/icons/amex.svg" },
		{ label: "Apple Pay", src: "/images/icons/apple-pay.svg" },
		{ label: "Google Pay", src: "/images/icons/google-pay.svg" },
		{ label: "Amazon Pay", src: "/images/icons/amazon-pay.svg" },
	];

	const footer = globalContent.footer ?? null;
	const newsletter = globalContent.newsletter ?? null;

	return (
		<FooterClient
			paymentIcons={paymentIcons}
			year={year}
			socialLinks={seloSocialLinks}
			brandName={seloSiteMeta.name}
			brandEmail={supportEmail || seloSiteMeta.email}
			brandEyebrow={footer?.brandEyebrow || "Selo Libertária"}
			brandDescription={
				footer?.brandDescription ||
				"Livros, performances, oficinas e programação cultural reunidos em um mesmo site editorial."
			}
			newsletterTitle={newsletter?.title || "Receba lançamentos, saraus e textos do selo."}
			newsletterDescription={
				newsletter?.description ||
				"Atualizações de livros, agenda e circulação editorial em um único campo público editável."
			}
			newsletterPlaceholder={newsletter?.placeholder || "seu@email.com"}
			newsletterButtonLabel={newsletter?.buttonLabel || "Assinar"}
			sections={[
				{
					header: footer?.catalogueTitle || "Loja",
					links: [
						{ label: "Catálogo", href: "/products" },
						...dynamicCategories.map(({ name, slug }) => ({
							label: name,
							href: `/category/${slug}`,
						})),
					],
				},
				{
					header: footer?.editorialTitle || "Editorial",
					links: [
						{ label: "Projetos", href: "/projects" },
						{ label: "Sarau Safado", href: "/sarau-safado" },
						{ label: "Sobre", href: "/about" },
						{ label: "Contato", href: "/contact" },
					],
				},
				{
					header: footer?.supportTitle || "Suporte",
					links: footer?.auxiliaryLinks
						?.filter((link) => link.label && link.href)
						.map((link) => ({
							label: link.label as string,
							href: link.href as string,
						})) || [
						{ label: "FAQ", href: "/faq" },
						{ label: "Termos", href: "/terms" },
						{ label: "Privacidade", href: "/privacy" },
					],
				},
			]}
			copyrightText={footer?.copyrightText || "Selo Libertária."}
			developedByLabel="Desenvolvido por"
			paymentMethodsLabel="Métodos de pagamento aceitos"
		/>
	);
}
