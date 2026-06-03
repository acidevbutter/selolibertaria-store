import "server-only";
import type { Collection, Document, ObjectId } from "mongodb";
import { env } from "@/env.mjs";
import { type EmailProvider, resolveEmailProviders, type SendEmailMode } from "@/lib/email-delivery-plan";
import { getMongoClient } from "@/lib/mongodb";

type MailAddress = string | { name?: string; address: string };

type EmailProviderAttempt = {
	provider: EmailProvider;
	success: boolean;
	error?: string;
	messageId?: string;
};

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
	mode?: SendEmailMode;
	log?: SendEmailLog;
};

type MinimalTransporter = { sendMail: (opts: Record<string, unknown>) => Promise<{ messageId?: string }> };
let transporter: MinimalTransporter | null = null;

async function getTransporter() {
	if (transporter) return transporter;
	if (!env.SMTP_HOST || !env.SMTP_FROM) {
		throw new Error("Missing SMTP_HOST or SMTP_FROM configuration");
	}
	const nodemailer = (await import("nodemailer")).default;
	const transportOpts: Record<string, unknown> = {
		host: env.SMTP_HOST,
		port: env.SMTP_PORT ?? 587,
		secure: (env.SMTP_PORT ?? 587) === 465,
	};
	if (env.SMTP_USER && env.SMTP_PASS) transportOpts.auth = { user: env.SMTP_USER, pass: env.SMTP_PASS };
	transporter = nodemailer.createTransport(transportOpts);
	return transporter;
}

function normalizeAddresses(addr: MailAddress | MailAddress[] | undefined) {
	const recipients: string[] = [];

	function extract(value: MailAddress | MailAddress[] | undefined) {
		if (!value) return;
		if (Array.isArray(value)) {
			for (const entry of value) extract(entry);
			return;
		}
		if (typeof value === "string") {
			recipients.push(value.toLowerCase());
			return;
		}
		if (value.address) recipients.push(String(value.address).toLowerCase());
	}

	extract(addr);
	return Array.from(new Set(recipients));
}

function buildMailPayload(opts: SendEmailOptions) {
	return {
		to: opts.to,
		subject: opts.subject,
		text: opts.text,
		html: opts.html,
		cc: opts.cc,
		bcc: opts.bcc,
		replyTo: opts.replyTo,
	};
}

function normalizeNamedAddresses(addr: MailAddress | MailAddress[] | undefined) {
	const recipients: Array<{ email: string; name?: string }> = [];

	function extract(value: MailAddress | MailAddress[] | undefined) {
		if (!value) return;
		if (Array.isArray(value)) {
			for (const entry of value) extract(entry);
			return;
		}
		if (typeof value === "string") {
			recipients.push({ email: value.toLowerCase() });
			return;
		}
		if (value.address) {
			recipients.push({
				email: String(value.address).toLowerCase(),
				name: value.name,
			});
		}
	}

	extract(addr);
	return recipients;
}

function withValue<T>(value: T | undefined, predicate: (candidate: T) => boolean) {
	if (value === undefined) return undefined;
	return predicate(value) ? value : undefined;
}

async function sendWithSmtp(opts: SendEmailOptions) {
	if (!env.SMTP_HOST || !env.SMTP_FROM) {
		throw new Error("Missing SMTP_HOST or SMTP_FROM configuration");
	}
	const t = (await getTransporter()) as MinimalTransporter;
	return await t.sendMail({ from: env.SMTP_FROM, ...buildMailPayload(opts) });
}

function getBrevoSender() {
	const email = env.BREVO_SENDER_EMAIL || env.SMTP_FROM;
	if (!env.BREVO_API_KEY || !email) return null;
	return {
		email,
		name: env.BREVO_SENDER_NAME || undefined,
	};
}

async function sendWithBrevo(opts: SendEmailOptions) {
	const sender = getBrevoSender();
	if (!sender || !env.BREVO_API_KEY) {
		throw new Error("Missing BREVO_API_KEY and/or BREVO_SENDER_EMAIL configuration");
	}

	const to = normalizeNamedAddresses(opts.to);
	const cc = normalizeNamedAddresses(opts.cc);
	const bcc = normalizeNamedAddresses(opts.bcc);
	const replyTo = normalizeNamedAddresses(opts.replyTo)[0];

	const payload = {
		sender,
		to,
		subject: opts.subject,
		...(opts.html ? { htmlContent: opts.html } : {}),
		...(opts.text ? { textContent: opts.text } : {}),
		...(withValue(cc, (entries) => entries.length > 0) ? { cc } : {}),
		...(withValue(bcc, (entries) => entries.length > 0) ? { bcc } : {}),
		...(replyTo ? { replyTo } : {}),
	};

	const response = await fetch("https://api.brevo.com/v3/smtp/email", {
		method: "POST",
		headers: {
			accept: "application/json",
			"api-key": env.BREVO_API_KEY,
			"content-type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Brevo request failed (${response.status}): ${body || response.statusText}`);
	}

	const data = (await response.json()) as { messageId?: string };
	return { messageId: data.messageId };
}

export async function sendEmail(opts: SendEmailOptions) {
	let info: { messageId?: string } | null = null;
	let sendError: string | null = null;
	let persistenceError: string | null = null;
	let providerUsed: EmailProvider | null = null;
	const attempts: EmailProviderAttempt[] = [];
	const insertedIds: Array<{ email: string; id?: unknown }> = [];
	const mode = opts.mode ?? "auto";
	const brevoConfigured = Boolean(getBrevoSender());

	const plan = resolveEmailProviders(mode, brevoConfigured);

	const providers: Array<{
		provider: EmailProvider;
		send: (options: SendEmailOptions) => Promise<{ messageId?: string }>;
	}> = plan.map((provider) => ({
		provider,
		send: provider === "brevo" ? sendWithBrevo : sendWithSmtp,
	}));

	for (const candidate of providers) {
		try {
			info = await candidate.send(opts);
			providerUsed = candidate.provider;
			attempts.push({
				provider: candidate.provider,
				success: true,
				messageId: info?.messageId,
			});
			sendError = null;
			break;
		} catch (err: unknown) {
			const error = err instanceof Error ? err.message : String(err);
			attempts.push({
				provider: candidate.provider,
				success: false,
				error,
			});
			sendError = error;
		}
	}

	if (!providerUsed && !sendError) {
		sendError = "No email provider configured";
	}

	try {
		const client = await getMongoClient();
		const commDb = client.db(env.MONGODB_DB_NAME);
		const coll: Collection<Document> = commDb.collection("communication");
		const sentAt = new Date();
		const html = opts.html ?? opts.text ?? "";
		const toRecipients = normalizeAddresses(opts.to);
		const ccRecipients = normalizeAddresses(opts.cc);
		const bccRecipients = normalizeAddresses(opts.bcc);
		const unique = Array.from(new Set([...toRecipients, ...ccRecipients, ...bccRecipients]));
		for (const email of unique) {
			try {
				const doc: Document = {
					email,
					subject: opts.subject,
					textBody: opts.text ?? null,
					emailBody: html,
					sentAt,
					status: "pending",
					messageId: info?.messageId ?? null,
					provider: providerUsed,
					mode,
					fallbackUsed: mode === "auto" && providerUsed === "smtp" && attempts.length > 1,
					attempts,
					kind: opts.log?.kind ?? "transactional",
					source: opts.log?.source ?? null,
					userId: opts.log?.userId ?? null,
					purchaseId: opts.log?.purchaseId ?? null,
					orderStatus: opts.log?.orderStatus ?? null,
					template: opts.log?.template ?? null,
					retryOfCommunicationId: opts.log?.retryOfCommunicationId ?? null,
					recipients: {
						to: toRecipients,
						cc: ccRecipients,
						bcc: bccRecipients,
					},
					updatedAt: sentAt,
				};
				const res = await coll.insertOne(doc);
				insertedIds.push({ email, id: res.insertedId });
			} catch (err: unknown) {
				persistenceError = err instanceof Error ? err.message : String(err);
			}
		}
		for (const rec of insertedIds) {
			try {
				const update: Partial<Document> = {};
				if (info?.messageId) update.messageId = info.messageId;
				if (sendError) {
					update.status = "failed";
					update.error = sendError;
				} else {
					update.status = "sent";
				}
				update.updatedAt = new Date();
				await coll.updateOne({ _id: rec.id as unknown as ObjectId }, { $set: update });
			} catch (err: unknown) {
				persistenceError = err instanceof Error ? err.message : String(err);
			}
		}
	} catch (err: unknown) {
		persistenceError = err instanceof Error ? err.message : String(err);
	}
	return {
		messageId: info?.messageId,
		sent: !sendError,
		communicationIds: insertedIds
			.map((record: { id?: unknown }) => (record.id ? String(record.id) : null))
			.filter((value: string | null): value is string => Boolean(value)),
		error: sendError ?? undefined,
		persistenceError: persistenceError ?? undefined,
	} as {
		messageId?: string | undefined;
		sent: boolean;
		communicationIds?: string[] | undefined;
		error?: string | undefined;
		persistenceError?: string | undefined;
	};
}
