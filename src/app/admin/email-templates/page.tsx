"use client";
import { useEffect, useState } from "react";
import { confirmationEmailHtml } from "@/lib/email-templates/confirmation";
import { favoriteDiscountEmailHtml } from "@/lib/email-templates/favorite-discount";
import { orderStatusEmailHtml } from "@/lib/email-templates/order-status";
import { passwordResetEmailHtml } from "@/lib/email-templates/password-reset";
import { transactionalEmailHtml } from "@/lib/email-templates/transactional";
import { getCustomerOrderStatusContent } from "@/lib/order-status-notification";

export default function EmailTemplatesPage() {
	const [supportEmail, setSupportEmail] = useState("");

	useEffect(() => {
		let mounted = true;
		async function loadSettings() {
			try {
				const res = await fetch("/api/admin/settings", { credentials: "include" });
				if (!res.ok) return;
				const data = (await res.json()) as { current?: { supportEmail?: string | null } } | null;
				const nextEmail = data?.current?.supportEmail?.trim();
				if (mounted && nextEmail) {
					setSupportEmail(nextEmail);
				}
			} catch {}
		}
		loadSettings();
		return () => {
			mounted = false;
		};
	}, []);

	const templates = [
		{
			id: "confirmation",
			label: "Confirmação de conta",
			render: () =>
				confirmationEmailHtml({
					name: "Customer",
					verifyUrl: "https://devbutterstore.local/verify?token=abc123",
					supportEmail,
				}),
		},
		{
			id: "password-reset",
			label: "Redefinição de senha",
			render: () =>
				passwordResetEmailHtml({
					name: "Customer",
					resetUrl: "https://devbutterstore.local/reset-password?token=xyz",
					supportEmail,
				}),
		},
		{
			id: "order-status",
			label: "Status do pedido",
			render: () => {
				const content = getCustomerOrderStatusContent({
					status: "shipped",
					trackingNumber: "BR123456789",
				});
				if (!content) return "";
				return orderStatusEmailHtml({
					name: "Customer",
					orderId: "1001",
					content,
					currency: "BRL",
					fulfillment: { status: "shipped", trackingNumber: "BR123456789" },
					items: [
						{ name: "T-shirt", qty: 2, unitAmount: 2000, image: "/images/devbutterstore-mark.svg" },
						{ name: "Poster", qty: 1, unitAmount: 1500, image: "/yns-cover.jpg" },
					],
					totalCents: 5500,
					supportEmail,
				});
			},
		},
		{
			id: "favorite-discount-alert",
			label: "Desconto em favorito",
			render: () =>
				favoriteDiscountEmailHtml({
					name: "Customer",
					productName: "Essential T-shirt",
					variantLabel: "Black / M",
					productUrl: "https://devbutterstore.local/product/essential-t-shirt",
					basePrice: "$129.90",
					effectivePrice: "$99.90",
					promotionLabel: "Flash sale",
					supportEmail,
				}),
		},
		{
			id: "transactional",
			label: "Transacional",
			render: () =>
				transactionalEmailHtml({
					title: "Welcome to Selo Libertaria",
					bodyHtml: `<p>Hello, <strong>Customer</strong>.</p><p>Thanks for following the selo.</p>`,
					supportEmail,
				}),
		},
	];

	const initial = templates.find((t) => t.id === "confirmation") ? "confirmation" : (templates[0]?.id ?? "");
	const [selected, setSelected] = useState<string>(initial);

	const current = templates.find((t) => t.id === selected) || templates[0];
	const html = current ? current.render() : "";

	return (
		<div className="p-6">
			<div className="mb-4">
				<div className="flex flex-wrap gap-2 mb-3">
					{templates.map((t) => (
						<button
							key={t.id}
							className={`px-3 py-2 rounded ${selected === t.id ? "bg-slate-800 text-white" : "bg-slate-700 text-slate-200"}`}
							onClick={() => setSelected(t.id)}
						>
							{t.label}
						</button>
					))}
				</div>
				<div>
					<select
						value={selected}
						onChange={(e) => setSelected(e.target.value)}
						className="border rounded px-3 py-2"
					>
						{templates.map((t) => (
							<option key={t.id} value={t.id}>
								{t.label}
							</option>
						))}
					</select>
				</div>
			</div>
			<div>
				<iframe
					title="email-preview"
					srcDoc={html}
					style={{ width: "100%", height: "700px", border: "1px solid #e5e7eb" }}
				/>
			</div>
		</div>
	);
}
