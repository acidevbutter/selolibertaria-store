"use client";

import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "@/i18n/client";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";
import { cn } from "@/lib/utils";
import { MainProductImage } from "@/ui/products/main-product-image";
import { Button } from "@/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/shadcn/dialog";

export function ProductImageGallery({ images, alt }: { images: string[]; alt: string }) {
	const t = useTranslations("ProductGallery");
	const normalizedImages = useMemo(() => images.filter(Boolean), [images]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [zoomed, setZoomed] = useState(false);
	const [isInteractiveZooming, setIsInteractiveZooming] = useState(false);
	const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
	const zoomSurfaceRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setCurrentIndex(0);
	}, [normalizedImages]);

	useEffect(() => {
		setIsInteractiveZooming(false);
	}, [currentIndex, zoomed]);

	if (!normalizedImages.length) {
		return (
			<div className="flex aspect-square w-full items-center justify-center bg-neutral-100 text-sm text-muted-foreground">
				{t("noImage")}
			</div>
		);
	}

	const currentImage = normalizedImages[currentIndex]!;
	const hasMultipleImages = normalizedImages.length > 1;

	const goToPrevious = () => {
		setCurrentIndex((current) => (current - 1 + normalizedImages.length) % normalizedImages.length);
	};

	const goToNext = () => {
		setCurrentIndex((current) => (current + 1) % normalizedImages.length);
	};

	const updateZoomPosition = (clientX: number, clientY: number) => {
		const bounds = zoomSurfaceRef.current?.getBoundingClientRect();
		if (!bounds) return;

		const x = ((clientX - bounds.left) / bounds.width) * 100;
		const y = ((clientY - bounds.top) / bounds.height) * 100;
		setZoomPosition({
			x: Math.max(0, Math.min(100, x)),
			y: Math.max(0, Math.min(100, y)),
		});
	};

	return (
		<>
			<div className="space-y-4">
				<div className="relative overflow-hidden bg-neutral-100">
					<button
						type="button"
						className="block w-full cursor-zoom-in"
						onClick={() => setZoomed(true)}
						aria-label={t("actions.zoom")}
					>
						<MainProductImage
							className="aspect-square w-full object-cover object-center transition-opacity"
							src={currentImage}
							loading="eager"
							priority
							alt={alt}
						/>
					</button>
					<div className="pointer-events-none absolute right-3 top-3 bg-background/90 p-2 text-foreground shadow-sm">
						<ZoomIn className="h-4 w-4" />
					</div>
					{hasMultipleImages ? (
						<>
							<Button
								type="button"
								variant="secondary"
								size="icon"
								className="absolute left-3 top-1/2 -translate-y-1/2 rounded-none"
								onClick={goToPrevious}
								aria-label={t("actions.previous")}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								variant="secondary"
								size="icon"
								className="absolute right-3 top-1/2 -translate-y-1/2 rounded-none"
								onClick={goToNext}
								aria-label={t("actions.next")}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</>
					) : null}
				</div>

				{hasMultipleImages ? (
					<div className="flex gap-3 overflow-x-auto pb-1">
						{normalizedImages.map((image, index) => (
							<button
								key={`${image}-${index}`}
								type="button"
								onClick={() => setCurrentIndex(index)}
								className={cn(
									"shrink-0 overflow-hidden border bg-neutral-100",
									currentIndex === index ? "border-foreground" : "border-transparent",
								)}
								aria-label={t("actions.viewImage", { index: index + 1 })}
							>
								<Image
									src={image}
									alt={`${alt} ${index + 1}`}
									width={88}
									height={88}
									className="h-20 w-20 object-cover"
									sizes="80px"
									{...getProductImageOptimizationProps(image)}
								/>
							</button>
						))}
					</div>
				) : null}
			</div>

			<Dialog open={zoomed} onOpenChange={setZoomed}>
				<DialogContent className="max-w-6xl border-none bg-transparent p-0 shadow-none">
					<DialogHeader className="sr-only">
						<DialogTitle>{alt}</DialogTitle>
						<DialogDescription>{t("zoomedDescription")}</DialogDescription>
					</DialogHeader>
					<div className="relative overflow-hidden bg-background">
						<div
							ref={zoomSurfaceRef}
							className="relative flex max-h-[88vh] min-h-[50vh] items-center justify-center overflow-hidden"
							onMouseEnter={() => setIsInteractiveZooming(true)}
							onMouseLeave={() => setIsInteractiveZooming(false)}
							onMouseMove={(event) => updateZoomPosition(event.clientX, event.clientY)}
						>
							<Image
								src={currentImage}
								alt={alt}
								width={1800}
								height={1800}
								onClick={() => setIsInteractiveZooming((current) => !current)}
								className={cn(
									"max-h-[88vh] w-full object-contain transition-transform duration-75 ease-out",
									isInteractiveZooming ? "cursor-zoom-out" : "cursor-zoom-in",
								)}
								sizes="90vw"
								style={
									isInteractiveZooming
										? {
												transform: "scale(2.4)",
												transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
											}
										: undefined
								}
								{...getProductImageOptimizationProps(currentImage)}
							/>
						</div>
						{hasMultipleImages ? (
							<>
								<Button
									type="button"
									variant="secondary"
									size="icon"
									className="absolute left-4 top-1/2 -translate-y-1/2 rounded-none"
									onClick={goToPrevious}
									aria-label={t("actions.previous")}
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button
									type="button"
									variant="secondary"
									size="icon"
									className="absolute right-4 top-1/2 -translate-y-1/2 rounded-none"
									onClick={goToNext}
									aria-label={t("actions.next")}
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</>
						) : null}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
