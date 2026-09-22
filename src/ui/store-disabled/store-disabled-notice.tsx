import Image from "next/image";
import { SlChip } from "@/ui/sl/sl-chip";

/** Shown in place of any shop route (products, cart, checkout, …) while STORE_DISABLED is on. */
export function StoreDisabledNotice() {
	return (
		<main
			data-screen-label="Loja desativada — Selo Libertária"
			className="flex min-h-svh flex-col"
			style={{ background: "var(--sl-paper)", color: "var(--sl-ink)" }}
		>
			<header
				className="flex flex-none items-center justify-between gap-6 px-[clamp(16px,4vw,48px)] py-4"
				style={{ background: "var(--sl-ink)" }}
			>
				<div className="flex min-w-0 items-center gap-3">
					<div className="h-[34px] w-[34px] shrink-0 overflow-hidden border border-[color:rgba(247,244,239,0.2)]">
						<Image
							src="/images/selolibertaria.png"
							alt="Selo Libertária"
							width={34}
							height={34}
							className="h-full w-full object-cover"
						/>
					</div>
					<div className="min-w-0">
						<div className="text-[10px] font-black tracking-[0.32em] text-[color:rgba(247,244,239,0.55)] uppercase">
							Selo
						</div>
						<div className="text-[13px] font-black tracking-[0.26em] text-[#F7F4EF] uppercase">
							Libertária
						</div>
					</div>
				</div>
				<SlChip tone="buy" className="flex-none whitespace-nowrap">
					Loja desativada
				</SlChip>
			</header>

			<div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
				<h1 className="sl-head m-0 text-[clamp(28px,5vw,52px)] leading-[0.95]">
					A loja está temporariamente fora do ar
				</h1>
				<p className="max-w-[480px] text-[15px] text-[color:rgba(26,22,20,0.7)]">
					O restante do site — conteúdo editorial, eventos e sarau — continua disponível pelo menu acima.
				</p>
			</div>
		</main>
	);
}
