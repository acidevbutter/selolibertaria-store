"use client";

import { EditorialLivePreview } from "@/app/admin/editorial/_components/editorial-live-preview.client";

export function EditorialPagePreview({
	href,
	published,
	formId,
	pageTitle,
}: {
	href: string;
	published: boolean;
	formId: string;
	pageTitle: string;
}) {
	return <EditorialLivePreview formId={formId} href={href} pageTitle={pageTitle} published={published} />;
}
