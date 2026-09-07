import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getLocale } from "@/i18n/server";
import { commerce } from "@/lib/commerce";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { formatMoney } from "@/lib/utils";

export const size = {
	width: 1200,
	height: 630,
};

export const contentType = "image/png";
export const alt = "";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Image(props: { params: Promise<{ slug: string }> }) {
	const params = await props.params;
	const locale = await getLocale();
	// Fertigo Pro — one of the project's two faces (see src/styles/sl-tokens.css).
	const fertigo = readFile(join(process.cwd(), "public/fonts/FertigoPro-Regular.otf"));
	// Note: accountGet not available in new SDK, using product only
	const product = await commerce.product.get({ slug: params.slug });

	if (!product) {
		return null;
	}

	return new ImageResponse(
		<div
			style={{ fontFamily: "Fertigo Pro" }}
			tw="bg-neutral-100 w-full h-full flex flex-row items-stretch justify-center"
		>
			<div tw="flex-1 flex justify-center items-center">
				<div
					style={{
						backgroundImage: `url(${product.images[0]})`,
						backgroundSize: "600px 630px",
						backgroundPosition: "center center",
						width: "600px",
						height: "630px",
						display: "flex",
					}}
				/>
			</div>
			<div tw="flex-1 flex flex-col items-center justify-center border-l border-neutral-200">
				<div tw="w-full mt-8 text-left px-16 font-normal text-4xl">{seloSiteMeta.name}</div>
				<div tw="flex-1 -mt-8 flex flex-col items-start justify-center px-16">
					<p tw="font-black text-5xl mb-0">{product.name}</p>
					<p tw="font-normal text-neutral-800 mt-0 text-3xl">
						{formatMoney({
							amount: product.price,
							currency: product.currency,
							locale,
						})}
					</p>
					<p tw="font-normal text-xl max-h-[7rem]">{product.summary || ""}</p>
				</div>
			</div>
		</div>,
		{
			...size,
			// debug: true,
			fonts: [
				{
					name: "Fertigo Pro",
					data: await fertigo,
					style: "normal",
					weight: 400,
				},
			],
		},
	);
}
