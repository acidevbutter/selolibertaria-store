"use client";

import { MenuIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { useTranslations } from "@/i18n/client";

export const NavMobileMenu = ({ children }: { children: ReactNode }) => {
	const [isOpen, setIsOpen] = useState(false);
	const t = useTranslations("Global.nav.mobileMenu");
	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			<DrawerTrigger>
				{/* hamburger menu icon: make it turn project red on hover */}
				<MenuIcon className="hover:text-red-700" />
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle className="text-center font-vtks text-md">{t("title")}</DrawerTitle>
					<DrawerDescription className="sr-only">{t("description")}</DrawerDescription>
				</DrawerHeader>
				<div
					className="font-vtks"
					onClick={(e) => {
						if (e.target instanceof HTMLElement && e.target.closest("a")) {
							setIsOpen(false);
						}
					}}
				>
					{children}
				</div>
			</DrawerContent>
		</Drawer>
	);
};
