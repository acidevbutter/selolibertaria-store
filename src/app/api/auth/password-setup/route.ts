import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { issuePasswordSetupToken } from "@/lib/account-access";
import { requireAuth } from "@/lib/api-auth";
import { getDb } from "@/lib/mongodb";

export async function GET(req: Request) {
	const auth = await requireAuth();
	if ("error" in auth) {
		return NextResponse.redirect(new URL("/login", req.url));
	}

	const userId = auth.session.sub as string;
	const db = await getDb();
	const user = await db
		.collection("users")
		.findOne<{ passwordHash?: string }>({ _id: new ObjectId(userId) }, { projection: { passwordHash: 1 } });

	const next = new URL(req.url).searchParams.get("next");
	if (user?.passwordHash) {
		return NextResponse.redirect(new URL(next || "/user?section=purchases", req.url));
	}

	const { token } = await issuePasswordSetupToken(userId);
	const redirectUrl = new URL("/reset-password", req.url);
	redirectUrl.searchParams.set("token", token);
	if (next) redirectUrl.searchParams.set("next", next);
	return NextResponse.redirect(redirectUrl);
}
