"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

type Props = {
	defaultStatus: string;
	defaultPeriod: string;
	defaultSort: string;
};

export function AdminFilters({ defaultStatus, defaultPeriod, defaultSort }: Props) {
	const params = useSearchParams();
	const formRef = useRef<HTMLFormElement>(null);

	const current = useMemo(() => {
		return {
			status: params.get("status") ?? defaultStatus,
			period: params.get("period") ?? defaultPeriod,
			sort: params.get("sort") ?? defaultSort,
		};
	}, [params, defaultStatus, defaultPeriod, defaultSort]);

	const submit = () => formRef.current?.requestSubmit();

	return (
		<form ref={formRef} method="get" className="flex flex-wrap gap-3 items-center">
			<input type="hidden" name="status" defaultValue={current.status} />
			<input type="hidden" name="period" defaultValue={current.period} />
			<input type="hidden" name="sort" defaultValue={current.sort} />

			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground">Status</span>
				<Select
					defaultValue={current.status}
					onValueChange={(v) => {
						const i = formRef.current?.elements.namedItem("status") as HTMLInputElement | null;
						if (i) i.value = v;
						submit();
					}}
				>
					<SelectTrigger className="w-[158px] sm:w-[184px]">
						<SelectValue placeholder="Todos" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos</SelectItem>
						<SelectItem value="paid">Pago</SelectItem>
						<SelectItem value="succeeded">Concluído</SelectItem>
						<SelectItem value="requires_action">Exige ação</SelectItem>
						<SelectItem value="pending">Pendente</SelectItem>
						<SelectItem value="processing">Em processamento</SelectItem>
						<SelectItem value="failed">Falhou</SelectItem>
						<SelectItem value="refunded">Reembolsado</SelectItem>
						<SelectItem value="disputed">Em disputa</SelectItem>
						<SelectItem value="canceled">Cancelado</SelectItem>
						<SelectItem value="expired">Expirado</SelectItem>
						<SelectItem value="voided">Anulado</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground">Período</span>
				<Select
					defaultValue={current.period}
					onValueChange={(v) => {
						const i = formRef.current?.elements.namedItem("period") as HTMLInputElement | null;
						if (i) i.value = v;
						submit();
					}}
				>
					<SelectTrigger className="w-[152px] sm:w-[174px]">
						<SelectValue placeholder="Últimos 30 dias" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7d">Últimos 7 dias</SelectItem>
						<SelectItem value="30d">Últimos 30 dias</SelectItem>
						<SelectItem value="90d">Últimos 90 dias</SelectItem>
						<SelectItem value="365d">Últimos 365 dias</SelectItem>
						<SelectItem value="all">Todo o período</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground">Ordenação</span>
				<Select
					defaultValue={current.sort}
					onValueChange={(v) => {
						const i = formRef.current?.elements.namedItem("sort") as HTMLInputElement | null;
						if (i) i.value = v;
						submit();
					}}
				>
					<SelectTrigger className="w-[178px] sm:w-[212px]">
						<SelectValue placeholder="Data mais recente" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="date-desc">Data mais recente</SelectItem>
						<SelectItem value="date-asc">Data mais antiga</SelectItem>
						<SelectItem value="amount-desc">Valor do maior para o menor</SelectItem>
						<SelectItem value="amount-asc">Valor do menor para o maior</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</form>
	);
}
