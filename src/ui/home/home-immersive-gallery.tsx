import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import { seloHomeImmersiveGallery } from "@/lib/selolibertaria-content";

export async function HomeImmersiveGallery() {
	const t = await getTranslations("Selo");
	const [primaryImage, ...secondaryImages] = seloHomeImmersiveGallery.images;

	if (!primaryImage) {
		return null;
	}

	return (
		<section className="overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top,rgba(111,26,22,0.25),transparent_42%),linear-gradient(180deg,#120d0d,#0d0b0b)] p-6 text-primary-foreground sm:p-8 lg:p-10">
			<div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
				<p className="text-xs uppercase tracking-[0.3em] text-primary-foreground/50 sm:text-sm">
					{t("home.immersive.eyebrow")}
				</p>
				<p className="max-w-2xl text-balance text-2xl leading-tight font-medium sm:text-3xl">
					{t("home.immersive.quote")}
				</p>
			</div>

			<div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
				<div className="overflow-hidden border border-white/10">
					<Image
						src={primaryImage.src}
						alt={primaryImage.alt}
						width={960}
						height={840}
						className="h-full min-h-[340px] w-full object-cover"
						sizes="(max-width: 1024px) 100vw, 760px"
					/>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
					{secondaryImages.map((image) => (
						<div key={image.alt} className="overflow-hidden border border-white/10">
							<Image
								src={image.src}
								alt={image.alt}
								width={640}
								height={480}
								className="h-full min-h-[160px] w-full object-cover"
								sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
