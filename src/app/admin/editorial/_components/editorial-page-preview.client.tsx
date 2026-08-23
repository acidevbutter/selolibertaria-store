"use client";

import { EditorialFullPagePreview } from "@/app/admin/editorial/_components/editorial-live-preview.client";

export function EditorialPagePreview({
	href,
	published: _published,
	formId: _formId,
	pageTitle: _pageTitle,
}: {
	href: string;
	published: boolean;
	formId: string;
	pageTitle: string;
}) {
	return <EditorialFullPagePreview href={href} />;
}
