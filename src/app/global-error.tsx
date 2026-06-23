"use client";

import { useState } from "react";
import { useTranslations } from "@/i18n/client";

function safeT() {
	try {
		return useTranslations("Global.globalError");
	} catch {
		return (k: string) => {
			switch (k) {
				case "title":
					return "Algo deu errado";
				case "moreDetails":
					return "Mais detalhes";
				case "tryAgainButton":
					return "Tentar novamente";
				default:
					return k;
			}
		};
	}
}

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const [, force] = useState(0);
	const t = safeT();

	return (
		<html>
			<body>
				<h2>{t("title")}</h2>
				<p>{error.message}</p>
				{(error.digest || error.stack) && (
					<details>
						<summary>{t("moreDetails")}</summary>
						{error.digest && <p>{error.digest}</p>}
						{error.stack && <pre>{error.stack}</pre>}
					</details>
				)}
				<button
					onClick={() => {
						try {
							reset();
						} catch {
							force((n) => n + 1);
						}
					}}
				>
					{t("tryAgainButton")}
				</button>
			</body>
		</html>
	);
}
