import { blockText } from "@/lib/editorial-blocks-slots";
import { getEditorialSiteGlobal } from "@/lib/editorial-content-store";
import { listSystemCategoriesWithProducts } from "@/lib/product-categories";
import { seloSiteMeta, seloSocialLinks } from "@/lib/selolibertaria-content";
import { getSupportEmailSetting } from "@/lib/settings-store";
import FooterClient from "@/ui/footer/footer.client";

export async function Footer() {
	const year = new Date().getFullYear();
	const [globalContent, dynamicCategories, supportEmail] = await Promise.all([
		getEditorialSiteGlobal(),
		listSystemCategoriesWithProducts(),
		getSupportEmailSetting(),
	]);

	const paymentIcons = [
		{ label: "Pix", src: "/images/icons/pix.svg" },
		{ label: "Visa", src: "/images/icons/visa.svg" },
		{ label: "Mastercard", src: "/images/icons/mastercard.svg" },
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
			brandEyebrow={
				blockText(globalContent.contentDoc, "global-footer-brand-eyebrow") ||
				footer?.brandEyebrow ||
				"Selo Libertária"
			}
			brandDescription={
				blockText(globalContent.contentDoc, "global-footer-brand-description") ||
				footer?.brandDescription ||
				"Livros, performances, oficinas e programação cultural reunidos em um mesmo site editorial."
			}
			newsletterTitle={
				blockText(globalContent.contentDoc, "global-newsletter-title") ||
				newsletter?.title ||
				"Receba lançamentos, saraus e textos do selo."
			}
			newsletterDescription={
				blockText(globalContent.contentDoc, "global-newsletter-description") ||
				newsletter?.description ||
				"Atualizações de livros, agenda e circulação editorial em um único campo público editável."
			}
			newsletterPlaceholder={newsletter?.placeholder || "seu@email.com"}
			newsletterButtonLabel={
				blockText(globalContent.contentDoc, "global-newsletter-button-label") ||
				newsletter?.buttonLabel ||
				"Assinar"
			}
			sections={[
				{
					header:
						blockText(globalContent.contentDoc, "global-footer-catalogue-title") ||
						footer?.catalogueTitle ||
						"Loja",
					links: [
						{ label: "Catálogo", href: "/products" },
						...dynamicCategories.map(({ name, slug }) => ({
							label: name,
							href: `/category/${slug}`,
						})),
					],
				},
				{
					header:
						blockText(globalContent.contentDoc, "global-footer-editorial-title") ||
						footer?.editorialTitle ||
						"Editorial",
					links: [
						{ label: "Projetos", href: "/projects" },
						{ label: "Sarau Safado", href: "/sarau-safado" },
						{ label: "Sobre", href: "/about" },
						{ label: "Contato", href: "/contact" },
					],
				},
				{
					header:
						blockText(globalContent.contentDoc, "global-footer-support-title") ||
						footer?.supportTitle ||
						"Suporte",
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
			copyrightText={
				blockText(globalContent.contentDoc, "global-footer-copyright") ||
				footer?.copyrightText ||
				"Selo Libertária."
			}
			developedByLabel="Desenvolvido por"
			paymentMethodsLabel="Métodos de pagamento aceitos"
		/>
	);
}
