import { redirect } from "next/navigation";
import { STORE_DISABLED } from "@/lib/store-status";
import { StoreDisabledNotice } from "@/ui/store-disabled/store-disabled-notice";

export default function LojaDesativadaPage() {
	if (!STORE_DISABLED) {
		redirect("/");
	}

	return <StoreDisabledNotice />;
}
