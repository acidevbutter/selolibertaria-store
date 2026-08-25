import "server-only";

import { env } from "@/env.mjs";

type MailAddress = string | { name?: string; address: string };

export type SendEmailLog = {
	kind?: string;
	source?: string;
	userId?: string;
	purchaseId?: string;
	orderStatus?: string;
	template?: string;
	retryOfCommunicationId?: string;
};

export type SendEmailOptions = {
	to: MailAddress | MailAddress[];
	subject: string;
	text?: string;
	html?: string;
	cc?: MailAddress | MailAddress[];
	bcc?: MailAddress | MailAddress[];
	replyTo?: MailAddress;
	log?: SendEmailLog;
};

type CommunicationResponse = {
	id?: string;
	provider_message_id?: string | null;
	error?: string | null;
};

function normalizeAddresses(addr: MailAddress | MailAddress[] | undefined) {
	const recipients: Array<{ email: string; name?: string }> = [];

	function extract(value: MailAddress | MailAddress[] | undefined) {
		if (!value) return;
		if (Array.isArray(value)) {
			for (const entry of value) extract(entry);
			return;
		}
		if (typeof value === "string") {
			recipients.push({ email: value.trim().toLowerCase() });
			return;
		}
		if (value.address) {
			recipients.push({ email: value.address.trim().toLowerCase(), name: value.name });
		}
	}

	extract(addr);
	return recipients.filter(
		(entry, index, values) => values.findIndex((item) => item.email === entry.email) === index,
	);
}

export async function sendEmail(opts: SendEmailOptions) {
	const recipients = normalizeAddresses(opts.to);
	if (recipients.length === 0) {
		return { sent: false, error: "Nenhum destinatário informado." };
	}

	const cc = normalizeAddresses(opts.cc);
	const bcc = normalizeAddresses(opts.bcc);
	const communicationIds: string[] = [];
	let messageId: string | undefined;

	for (const recipient of recipients) {
		const response = await fetch(`${env.FASTAPI_API_URL}/communications/send`, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY,
			},
			body: JSON.stringify({
				to: recipient.email,
				subject: opts.subject,
				text: opts.text,
				html: opts.html,
				template_key: opts.log?.template || "selolibertaria_transactional",
				payload: {
					to_name: recipient.name || null,
					cc,
					bcc,
					reply_to: normalizeAddresses(opts.replyTo)[0] || null,
				},
				kind: opts.log?.kind || "transactional",
				source: opts.log?.source || null,
				user_id: opts.log?.userId || null,
				order_id: opts.log?.purchaseId || null,
				retry_of_communication_id: opts.log?.retryOfCommunicationId || null,
			}),
			cache: "no-store",
		});

		const payload = (await response.json().catch(() => null)) as CommunicationResponse | null;
		if (!response.ok) {
			return {
				sent: false,
				communicationIds,
				error: payload?.error || "Não foi possível enfileirar o e-mail no Butter Relay.",
			};
		}
		if (payload?.id) communicationIds.push(payload.id);
		if (payload?.provider_message_id) messageId = payload.provider_message_id;
	}

	return { sent: true, messageId, communicationIds };
}
