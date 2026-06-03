import { describe, expect, it } from "vitest";
import { resolveEmailProviders } from "./email-delivery-plan";

describe("resolveEmailProviders", () => {
	it("prioriza a API antes do SMTP no modo automatico", () => {
		expect(resolveEmailProviders("auto", true)).toEqual(["brevo", "smtp"]);
	});

	it("usa apenas SMTP no modo automatico quando a API nao esta configurada", () => {
		expect(resolveEmailProviders("auto", false)).toEqual(["smtp"]);
	});

	it("forca apenas API quando solicitado", () => {
		expect(resolveEmailProviders("api", true)).toEqual(["brevo"]);
		expect(resolveEmailProviders("api", false)).toEqual(["brevo"]);
	});

	it("forca apenas SMTP quando solicitado", () => {
		expect(resolveEmailProviders("smtp", true)).toEqual(["smtp"]);
		expect(resolveEmailProviders("smtp", false)).toEqual(["smtp"]);
	});
});
