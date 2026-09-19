"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/api-auth";
import {
	closePresale,
	createPresale,
	deletePresale,
	type Presale,
	type PresaleCreateInput,
	type PresaleUpdateInput,
	publishPresale,
	skipPresaleSetup,
	updatePresale,
} from "@/lib/presales";

async function requirePresaleOperator() {
	const auth = await requireCapability("catalog.write");
	if ("error" in auth) {
		if (auth.error?.status === 401) redirect("/login");
		redirect("/forbidden");
	}
	return auth.session;
}

function refreshPresaleViews() {
	revalidatePath("/admin");
	revalidatePath("/admin/pre-venda");
}

export async function createPresaleAction(input: PresaleCreateInput): Promise<Presale> {
	await requirePresaleOperator();
	const presale = await createPresale(input);
	refreshPresaleViews();
	return presale;
}

export async function updatePresaleAction(id: string, input: PresaleUpdateInput): Promise<Presale> {
	await requirePresaleOperator();
	const presale = await updatePresale(id, input);
	refreshPresaleViews();
	return presale;
}

export async function publishPresaleAction(id: string): Promise<Presale> {
	await requirePresaleOperator();
	const presale = await publishPresale(id);
	refreshPresaleViews();
	return presale;
}

export async function skipPresaleSetupAction(id: string): Promise<void> {
	await requirePresaleOperator();
	await skipPresaleSetup(id);
	refreshPresaleViews();
}

export async function closePresaleAction(id: string): Promise<Presale> {
	await requirePresaleOperator();
	const presale = await closePresale(id);
	refreshPresaleViews();
	return presale;
}

export async function deletePresaleAction(id: string): Promise<void> {
	await requirePresaleOperator();
	await deletePresale(id);
	refreshPresaleViews();
}
