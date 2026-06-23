import { NextResponse } from "next/server";

type PostalLookupResult = {
	line1: string;
	line2: string;
	district: string;
	city: string;
	state: string;
	postalCode: string;
	country: "BR";
};

type LookupOutcome = PostalLookupResult | "not-found" | "unavailable";

export async function GET(req: Request) {
	const url = new URL(req.url);
	const country = url.searchParams.get("country")?.trim().toUpperCase();
	const postalCode = url.searchParams.get("postalCode")?.trim() || "";

	if (!country || !postalCode) {
		return NextResponse.json(
			{ error: "Missing country or postal code", code: "POSTAL_LOOKUP_MISSING_INPUT" },
			{ status: 400 },
		);
	}

	if (country !== "BR") {
		return NextResponse.json(
			{ error: "Postal lookup not available for this country", code: "POSTAL_LOOKUP_UNSUPPORTED_COUNTRY" },
			{ status: 404 },
		);
	}

	try {
		const digits = postalCode.replace(/\D+/g, "");
		if (digits.length !== 8) {
			return NextResponse.json(
				{ error: "Invalid postal code", code: "POSTAL_LOOKUP_INVALID_CODE" },
				{ status: 400 },
			);
		}
		let sawUnavailableProvider = false;
		for (const lookupProvider of [lookupViaCep, lookupBrasilApi]) {
			const result = await lookupProvider(digits);
			if (result === "unavailable") {
				sawUnavailableProvider = true;
				continue;
			}
			if (result !== "not-found") {
				return NextResponse.json({ result });
			}
		}

		if (sawUnavailableProvider) {
			return NextResponse.json(
				{ error: "Lookup failed", code: "POSTAL_LOOKUP_PROVIDER_UNAVAILABLE" },
				{ status: 502 },
			);
		}
		return NextResponse.json(
			{ error: "Postal code not found", code: "POSTAL_LOOKUP_NOT_FOUND" },
			{ status: 404 },
		);
	} catch (error) {
		console.error("[postal-lookup]", error);
		return NextResponse.json({ error: "Lookup failed", code: "POSTAL_LOOKUP_FAILED" }, { status: 500 });
	}
}

async function lookupViaCep(digits: string): Promise<LookupOutcome> {
	try {
		const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
			cache: "no-store",
		});
		if (!res.ok) return res.status === 404 ? "not-found" : "unavailable";

		const data = (await res.json()) as {
			erro?: boolean;
			logradouro?: string;
			bairro?: string;
			localidade?: string;
			uf?: string;
			cep?: string;
		};
		if (data.erro) return "not-found";

		return {
			line1: data.logradouro || "",
			line2: "",
			district: data.bairro || "",
			city: data.localidade || "",
			state: data.uf || "",
			postalCode: data.cep || formatBrazilianPostalCode(digits),
			country: "BR",
		};
	} catch {
		return "unavailable";
	}
}

async function lookupBrasilApi(digits: string): Promise<LookupOutcome> {
	try {
		const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
			cache: "no-store",
		});
		if (!res.ok) return res.status === 404 ? "not-found" : "unavailable";

		const data = (await res.json()) as {
			cep?: string;
			state?: string;
			city?: string;
			neighborhood?: string;
			street?: string;
		};

		return {
			line1: data.street || "",
			line2: "",
			district: data.neighborhood || "",
			city: data.city || "",
			state: data.state || "",
			postalCode: data.cep || formatBrazilianPostalCode(digits),
			country: "BR",
		};
	} catch {
		return "unavailable";
	}
}

function formatBrazilianPostalCode(digits: string) {
	return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}
