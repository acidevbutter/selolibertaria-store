"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocale, useTranslations } from "@/i18n/client";

// Mock data for orders
const orders = [
	{ id: "1", customer: "John Doe", date: "2023-05-01", total: 99.99, status: "Completed" },
	{ id: "2", customer: "Jane Smith", date: "2023-05-02", total: 149.99, status: "Processing" },
	{ id: "3", customer: "Bob Johnson", date: "2023-05-03", total: 79.99, status: "Shipped" },
	{ id: "4", customer: "Alice Brown", date: "2023-05-04", total: 199.99, status: "Completed" },
	{ id: "5", customer: "Charlie Davis", date: "2023-05-05", total: 59.99, status: "Processing" },
];

export function OrderList() {
	const t = useTranslations("Orders");
	const locale = useLocale();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const ordersPerPage = 5;

	const filteredOrders = orders.filter(
		(order) =>
			(order.customer.toLowerCase().includes(searchTerm.toLowerCase()) || order.id.includes(searchTerm)) &&
			(statusFilter === "all" || order.status.toLowerCase() === statusFilter),
	);

	const indexOfLastOrder = currentPage * ordersPerPage;
	const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
	const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

	const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
				<div className="relative w-full sm:w-64">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t("searchPlaceholder")}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-8"
					/>
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-full sm:w-40">
						<SelectValue placeholder={t("filterPlaceholder")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("filters.all")}</SelectItem>
						<SelectItem value="completed">{t("filters.completed")}</SelectItem>
						<SelectItem value="processing">{t("filters.processing")}</SelectItem>
						<SelectItem value="shipped">{t("filters.shipped")}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="border rounded-md">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("table.orderId")}</TableHead>
							<TableHead>{t("table.customer")}</TableHead>
							<TableHead>{t("table.date")}</TableHead>
							<TableHead>{t("table.total")}</TableHead>
							<TableHead>{t("table.status")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{currentOrders.map((order) => (
							<TableRow key={order.id}>
								<TableCell>{order.id}</TableCell>
								<TableCell>{order.customer}</TableCell>
								<TableCell>{order.date}</TableCell>
								<TableCell>
									{new Intl.NumberFormat(locale, {
										style: "currency",
										currency: "USD",
									}).format(order.total)}
								</TableCell>
								<TableCell>{t(`filters.${order.status.toLowerCase()}` as never)}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="flex justify-between items-center">
				<div className="text-sm text-muted-foreground">
					{t("results", {
						start: indexOfFirstOrder + 1,
						end: Math.min(indexOfLastOrder, filteredOrders.length),
						total: filteredOrders.length,
					})}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
						disabled={currentPage === 1}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
						disabled={currentPage === totalPages}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
