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
				<MenuIcon className="h-5 w-5 text-[color:var(--editorial-ink)]" />
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle className="text-left text-sm font-black uppercase tracking-[0.18em]">
						{t("title")}
					</DrawerTitle>
					<DrawerDescription className="sr-only">{t("description")}</DrawerDescription>
				</DrawerHeader>
				<div
					className="display-font"
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
