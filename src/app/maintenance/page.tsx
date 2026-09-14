import { redirect } from "next/navigation";
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode";
import { SeloLibertariaMaintenance } from "@/ui/maintenance/selo-libertaria-maintenance";

export default async function MaintenancePage() {
	if (!isMaintenanceModeEnabled()) {
		redirect("/");
	}

	return <SeloLibertariaMaintenance />;
}
