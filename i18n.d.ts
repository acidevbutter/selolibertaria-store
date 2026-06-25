import type ptBr from "./messages/pt-BR.json";

type Messages = typeof ptBr;

declare global {
	// Use type safe message keys
	interface IntlMessages extends Messages {}
}
