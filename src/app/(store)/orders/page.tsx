import { getTranslations } from "@/i18n/server";
import { OrderList } from "@/ui/order-list";

export default async function OrderPage() {
	const t = await getTranslations("Orders");
	return (
		<div className="py-10">
			<h1 className="text-2xl font-bold mb-5">{t("title")}</h1>
			<OrderList />
		</div>
	);
}
