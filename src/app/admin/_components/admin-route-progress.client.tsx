"use client";

import { useRouter } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
	useTransition,
} from "react";

type RouteProgress = {
	/** Href currently being loaded, or null. Drives the weak wash on the clicked item. */
	pendingHref: string | null;
	navigate: (href: string) => void;
};

const RouteProgressContext = createContext<RouteProgress>({ pendingHref: null, navigate: () => {} });

export function useAdminRouteProgress() {
	return useContext(RouteProgressContext);
}

/**
 * Route change without an overlay (§2.1): the previous screen stays legible and
 * readable while the next one loads. The only feedback is the 2px signal bar at
 * the top of the content area plus the clicked item in the weak paper wash.
 */
export function AdminRouteProgressProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [pendingHref, setPendingHref] = useState<string | null>(null);

	const navigate = useCallback(
		(href: string) => {
			setPendingHref(href);
			startTransition(() => {
				router.push(href);
			});
		},
		[router],
	);

	const value = useMemo(
		() => ({ pendingHref: isPending ? pendingHref : null, navigate }),
		[isPending, pendingHref, navigate],
	);

	return <RouteProgressContext.Provider value={value}>{children}</RouteProgressContext.Provider>;
}

/** The 2px bar (ui_kit `.load`). Sits at the top of the desk, never over it. */
export function AdminRouteBar() {
	const { pendingHref } = useAdminRouteProgress();

	return (
		<div className={`ad-load${pendingHref ? " on" : ""}`}>
			<i />
		</div>
	);
}
