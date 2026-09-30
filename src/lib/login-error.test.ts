import { describe, expect, it } from "vitest";
import { classifyLoginError, loginErrorQuery } from "./login-error";

describe("classifyLoginError", () => {
	it.each([
		["Credenciais inválidas", "invalid"],
		["E-mail não verificado. Enviamos um novo link de confirmação para o seu e-mail.", "unverified"],
		["Esta conta foi bloqueada", "blocked"],
		["Esta conta foi bloqueada. Entre em contato com o suporte.", "blocked"],
		["Login restrito à administração durante a manutenção.", "maintenance"],
		["Erro de autenticação", "server"],
		["", "server"],
	])("maps %j to %s", (detail, bucket) => {
		expect(classifyLoginError(detail)).toBe(bucket);
	});

	it("never treats a look-alike as a credentials error", () => {
		expect(classifyLoginError("credenciais inválidas")).toBe("server");
		expect(classifyLoginError("Conta bloqueada")).toBe("server");
	});

	it("builds the redirect query", () => {
		expect(loginErrorQuery("Esta conta foi bloqueada")).toBe("?login_error=blocked");
	});
});
