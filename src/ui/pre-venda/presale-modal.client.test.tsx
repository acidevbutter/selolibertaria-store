import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PresalePublic } from "@/lib/presales";
import { PresaleModal } from "@/ui/pre-venda/presale-modal.client";

const { pathnameMock } = vi.hoisted(() => ({ pathnameMock: vi.fn(() => "/") }));

vi.mock("next/navigation", () => ({
	usePathname: pathnameMock,
	useRouter: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
}));

const PRESALE: PresalePublic = {
	productId: "product_little-fish-big-fish",
	variantId: "variant_little-fish-big-fish_impresso",
	launchAt: "2026-12-01T19:00:00Z",
	presalePrice: 57.6,
	fullPrice: 72,
	status: "no_ar",
	modalEnabled: true,
	modalIntervalHours: 2,
	modalTitle: "little fish, big fish está em pré-venda",
	modalBody: "Reserve agora com desconto.",
};

const NEXT_SHOW_KEY = `presale:${PRESALE.productId}:next-show-at`;
const RESERVED_KEY = `presale:${PRESALE.productId}:reserved`;

beforeEach(() => {
	pathnameMock.mockReturnValue("/");
	window.localStorage.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("PresaleModal", () => {
	it("opens automatically when eligible and never dismissed before", async () => {
		render(<PresaleModal presale={PRESALE} buyHref="/product/little-fish-big-fish" />);
		expect(await screen.findByText(PRESALE.modalTitle)).toBeInTheDocument();
	});

	it("never opens on /cart or /checkout", () => {
		pathnameMock.mockReturnValue("/checkout");
		render(<PresaleModal presale={PRESALE} buyHref="/product/little-fish-big-fish" />);
		expect(screen.queryByText(PRESALE.modalTitle)).not.toBeInTheDocument();
	});

	it("does not reopen before the configured interval has passed", () => {
		window.localStorage.setItem(NEXT_SHOW_KEY, String(Date.now() + 60_000));
		render(<PresaleModal presale={PRESALE} buyHref="/product/little-fish-big-fish" />);
		expect(screen.queryByText(PRESALE.modalTitle)).not.toBeInTheDocument();
	});

	it("reopens once the interval has passed", async () => {
		window.localStorage.setItem(NEXT_SHOW_KEY, String(Date.now() - 1000));
		render(<PresaleModal presale={PRESALE} buyHref="/product/little-fish-big-fish" />);
		expect(await screen.findByText(PRESALE.modalTitle)).toBeInTheDocument();
	});

	it("stays hidden forever once the visitor has reserved", () => {
		window.localStorage.setItem(RESERVED_KEY, "true");
		window.localStorage.setItem(NEXT_SHOW_KEY, String(Date.now() - 1000));
		render(<PresaleModal presale={PRESALE} buyHref="/product/little-fish-big-fish" />);
		expect(screen.queryByText(PRESALE.modalTitle)).not.toBeInTheDocument();
	});

	it("snoozes for modalIntervalHours after dismissing", async () => {
		render(<PresaleModal presale={PRESALE} buyHref="/product/little-fish-big-fish" />);
		await screen.findByText(PRESALE.modalTitle);
		fireEvent.click(screen.getByRole("button", { name: "Agora não" }));

		await waitFor(() => expect(screen.queryByText(PRESALE.modalTitle)).not.toBeInTheDocument());
		const nextShowAt = Number(window.localStorage.getItem(NEXT_SHOW_KEY));
		expect(nextShowAt).toBeGreaterThan(Date.now() + 1.9 * 3_600_000);
		expect(nextShowAt).toBeLessThan(Date.now() + 2.1 * 3_600_000);
	});

	it("marks the visitor as reserved when the CTA is clicked", async () => {
		render(<PresaleModal presale={PRESALE} buyHref="/product/little-fish-big-fish" />);
		await screen.findByText(PRESALE.modalTitle);
		fireEvent.click(screen.getByRole("link", { name: "Reservar meu exemplar" }));

		expect(window.localStorage.getItem(RESERVED_KEY)).toBe("true");
	});

	it("never opens when the presale is closed (encerrada)", () => {
		render(
			<PresaleModal presale={{ ...PRESALE, status: "encerrada" }} buyHref="/product/little-fish-big-fish" />,
		);
		expect(screen.queryByText(PRESALE.modalTitle)).not.toBeInTheDocument();
	});
});
