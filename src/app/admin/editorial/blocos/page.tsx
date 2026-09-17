import { redirect } from "next/navigation";

/**
 * The fixed demo page (a hardcoded SEED_DOC, no real slug) moved to
 * `blocos/[slug]/page.tsx` — one page per real (type, slug) identity instead
 * of a single disconnected document. Visiting the bare route sends editors
 * back to the page picker.
 */
export default function AdminEditorialBlocksIndexPage() {
	redirect("/admin/editorial");
}
