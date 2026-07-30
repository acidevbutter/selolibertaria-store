"use client";

import { Eye, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/ui/shadcn/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/shadcn/dialog";

export function EditorialPagePreview({ href, published }: { href: string; published: boolean }) {
	const [mobile, setMobile] = useState(false);
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" className="rounded-none">
					<Eye className="h-4 w-4" />
					Visualizar página
				</Button>
			</DialogTrigger>
			<DialogContent className="h-[88vh] max-w-7xl overflow-hidden p-0">
				<DialogHeader className="flex-row items-center justify-between border-b p-4 pr-12">
					<DialogTitle>Visualização {published ? "publicada" : "do último conteúdo publicado"}</DialogTitle>
					<Button type="button" size="sm" variant="outline" onClick={() => setMobile((value) => !value)}>
						{mobile ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
						{mobile ? "Desktop" : "Mobile"}
					</Button>
				</DialogHeader>
				<div className="h-[calc(88vh-73px)] overflow-auto bg-muted p-4">
					<iframe
						title="Visualização da página pública"
						src={href}
						className={mobile ? "mx-auto h-full w-[390px] max-w-full bg-white" : "h-full w-full bg-white"}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
