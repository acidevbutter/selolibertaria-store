import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const notFoundMock = vi.fn(() => {
	throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
	notFound: () => notFoundMock(),
}));

vi.mock("@/app/admin/_components/sidebar.client", () => ({
	AdminSidebar: () => null,
}));

vi.mock("@/app/admin/_components/topbar.client", () => ({
	AdminTopbar: () => null,
}));

vi.mock("@/app/admin/_components/ui/DataTable", () => ({
	DataTable: () => null,
}));

vi.mock("@/app/admin/_components/ui/Field", () => ({
	Field: () => null,
}));

vi.mock("@/app/admin/_components/ui/MetricCard", () => ({
	MetricCard: () => null,
}));

vi.mock("@/app/admin/_components/ui/StatusBadge", () => ({
	StatusBadge: () => null,
}));

describe("AdminUiSandboxPage", () => {
	beforeEach(() => {
		notFoundMock.mockClear();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	// Order matters here: this case renders real JSX, which forces Node to
	// require() react's jsx-runtime shim for the first time under the
	// suite's normal (non-production) NODE_ENV. That shim picks its
	// dev/prod build once, at first require, and the choice is cached for
	// the rest of the process -- so this must run before the production
	// case below stubs NODE_ENV, or React's require cache locks in the
	// production (non-dev) jsx-runtime build and every later JSX render in
	// the file breaks with "jsxDEV is not a function".
	it("renders the sandbox without calling notFound() outside production", async () => {
		expect(process.env.NODE_ENV).not.toBe("production");
		const { default: AdminUiSandboxPage } = await import("./page");

		expect(() => AdminUiSandboxPage()).not.toThrow();
		expect(notFoundMock).not.toHaveBeenCalled();
	});

	it("returns a 404 via notFound() when NODE_ENV is production", async () => {
		vi.stubEnv("NODE_ENV", "production");
		const { default: AdminUiSandboxPage } = await import("./page");

		expect(() => AdminUiSandboxPage()).toThrow("NEXT_NOT_FOUND");
		expect(notFoundMock).toHaveBeenCalledTimes(1);
	});
});
