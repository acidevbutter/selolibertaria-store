import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { setUserBlockedAction, updateUserRoleAction } from "@/app/admin/users/actions";
import { auth } from "@/lib/auth";
import { hasCapability, isUserBlocked, normalizeUserRole, type UserRole } from "@/lib/authz";
import { getDb } from "@/lib/mongodb";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";

function isValidObjectId(id: string | undefined | null): id is string {
	return !!id && /^[0-9a-fA-F]{24}$/.test(id);
}

export default async function AdminUserDetails({ params }: { params: Promise<{ id: string }> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "customers.read")) redirect("/forbidden");

	const { id } = await params;
	if (!isValidObjectId(id)) redirect("/admin/users");

	const db = await getDb();
	const user = await db.collection("users").findOne<{
		_id: ObjectId;
		email: string;
		name?: string;
		role?: UserRole;
		phone?: string;
		address?: {
			line1?: string;
			city?: string;
			state?: string;
			postalCode?: string;
			country?: string;
		};
		access?: {
			blockedAt?: Date | string | null;
			blockedBy?: string | null;
			blockedReason?: string | null;
		} | null;
		purchases?: Array<{ id: string; status: string; createdAt: string | Date }>;
	}>({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });
	if (!user) redirect("/admin/users");
	const canManageStaff = hasCapability(session.user.role, "staff.manage");
	const role = normalizeUserRole(user.role);
	const blocked = isUserBlocked(user);

	return (
		<main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">User details</h1>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
				</CardHeader>
				<CardContent className="space-y-1">
					<div>
						<span className="text-muted-foreground">Email:</span>{" "}
						<span className="break-all">{user.email}</span>
					</div>
					<div>
						<span className="text-muted-foreground">Role:</span> {role}
					</div>
					<div>
						<span className="text-muted-foreground">Access:</span>{" "}
						<span className={blocked ? "text-destructive" : "text-emerald-600"}>
							{blocked ? "Blocked" : "Active"}
						</span>
					</div>
					{user.name && (
						<div>
							<span className="text-muted-foreground">Name:</span> {user.name}
						</div>
					)}
					{user.phone && (
						<div>
							<span className="text-muted-foreground">Phone:</span> {user.phone}
						</div>
					)}
					{user.address && (
						<div className="text-sm text-muted-foreground">
							Address:{" "}
							{[
								user.address.line1,
								user.address.city,
								user.address.state,
								user.address.postalCode,
								user.address.country,
							]
								.filter(Boolean)
								.join(", ")}
						</div>
					)}
				</CardContent>
			</Card>
			{canManageStaff ? (
				<Card>
					<CardHeader>
						<CardTitle>Access management</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2 text-sm text-muted-foreground">
							<p>
								Only admins can change roles or block access. Any change revokes the user's active sessions
								immediately.
							</p>
							{blocked && user.access?.blockedReason ? (
								<p className="text-destructive">Reason: {user.access.blockedReason}</p>
							) : null}
						</div>
						<form action={updateUserRoleAction} className="space-y-3 rounded-xl border p-4">
							<input type="hidden" name="userId" value={id} />
							<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
								<label className="grid gap-2">
									<span className="text-sm font-medium">Role</span>
									<select
										name="role"
										defaultValue={role}
										className="min-w-48 rounded-md border bg-background px-3 py-2 text-sm"
									>
										<option value="customer">Customer</option>
										<option value="vendor">Vendor</option>
										<option value="admin">Admin</option>
									</select>
								</label>
								<Button type="submit">Update role</Button>
							</div>
						</form>
						<form action={setUserBlockedAction} className="space-y-3 rounded-xl border p-4">
							<input type="hidden" name="userId" value={id} />
							<input type="hidden" name="blocked" value={blocked ? "false" : "true"} />
							<label className="grid gap-2">
								<span className="text-sm font-medium">{blocked ? "Unblock note" : "Block reason"}</span>
								<textarea
									name="reason"
									rows={3}
									defaultValue={user.access?.blockedReason ?? ""}
									placeholder={
										blocked
											? "Optionally update the unblock note"
											: "Describe why this account is being blocked"
									}
									className="rounded-md border bg-background px-3 py-2 text-sm"
								/>
							</label>
							<Button type="submit" variant={blocked ? "secondary" : "destructive"}>
								{blocked ? "Unblock user" : "Block user"}
							</Button>
						</form>
					</CardContent>
				</Card>
			) : null}
			<Card>
				<CardHeader>
					<CardTitle>Purchases</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="divide-y">
						{(user.purchases || []).map((p: { id: string; status: string; createdAt: string | Date }) => (
							<li key={p.id} className="py-3 flex items-center justify-between gap-3">
								<div>
									<div className="font-medium capitalize">{p.status}</div>
									<div className="text-sm text-muted-foreground">
										{new Date(p.createdAt).toLocaleString()}
									</div>
								</div>
								<div className="text-sm font-mono break-all">{p.id}</div>
							</li>
						))}
						{(!user.purchases || user.purchases.length === 0) && (
							<li className="py-6 text-muted-foreground">No purchases.</li>
						)}
					</ul>
				</CardContent>
			</Card>
		</main>
	);
}
