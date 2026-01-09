"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { RecurringExpenseWithCategory } from "@/types/database";
import { getCurrencySymbol } from "@/lib/constants";
import { formatRecurrenceRule } from "@/lib/recurrence";

interface RecurringExpenseTableProps {
  recurringExpenses: RecurringExpenseWithCategory[];
  onEdit?: (recurringExpense: RecurringExpenseWithCategory) => void;
  onDelete?: (recurringExpense: RecurringExpenseWithCategory) => void;
  onTogglePause?: (recurringExpense: RecurringExpenseWithCategory) => void;
}

export function RecurringExpenseTable({
  recurringExpenses,
  onEdit,
  onDelete,
  onTogglePause,
}: RecurringExpenseTableProps) {
  const t = useTranslations("recurring");
  const tCommon = useTranslations("common");

  const [sorting, setSorting] = useState<SortingState>([
    { id: "next_occurrence", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<RecurringExpenseWithCategory>[] = useMemo(
    () => [
      {
        accessorKey: "summary",
        header: t("summary"),
        cell: ({ row }) => {
          const summary = row.original.summary;
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {summary || (
                  <span className="text-muted-foreground">
                    {t("noSummary")}
                  </span>
                )}
              </span>
              {!row.original.is_active && (
                <Badge variant="secondary">{t("paused")}</Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "frequency",
        header: t("frequency"),
        cell: ({ row }) =>
          formatRecurrenceRule({
            frequency: row.original.frequency,
            customInterval: row.original.custom_interval ?? undefined,
            customUnit: row.original.custom_unit ?? undefined,
            dayOfWeekMask: row.original.day_of_week_mask,
            dayOfMonth: row.original.day_of_month ?? undefined,
            startDate: new Date(row.original.start_date),
          }),
      },
      {
        accessorKey: "category",
        header: t("category"),
        cell: ({ row }) => {
          const category = row.original.category;
          if (!category)
            return <span className="text-muted-foreground">-</span>;
          return (
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            {t("amount")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const amount = row.original.amount;
          const currency = row.original.currency;
          const symbol = getCurrencySymbol(currency);
          return (
            <span className="font-medium text-red-600 dark:text-red-400">
              -{symbol}
              {amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: "next_occurrence",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            {t("nextOccurrence")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) =>
          row.original.is_active
            ? format(new Date(row.original.next_occurrence), "MMM d, yyyy")
            : "-",
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{tCommon("openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                {tCommon("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePause?.(row.original)}>
                {row.original.is_active ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    {t("pause")}
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    {t("resume")}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(row.original)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tCommon("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [t, tCommon, onEdit, onDelete, onTogglePause],
  );

  const table = useReactTable({
    data: recurringExpenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const displayedRows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <Input
        placeholder={t("searchRecurring")}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-full sm:max-w-sm"
      />

      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {displayedRows.length ? (
          displayedRows.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {row.original.summary || t("noSummary")}
                    </span>
                    {!row.original.is_active && (
                      <Badge variant="secondary">{t("paused")}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatRecurrenceRule({
                      frequency: row.original.frequency,
                      customInterval: row.original.custom_interval ?? undefined,
                      customUnit: row.original.custom_unit ?? undefined,
                      dayOfWeekMask: row.original.day_of_week_mask,
                      dayOfMonth: row.original.day_of_month ?? undefined,
                      startDate: new Date(row.original.start_date),
                    })}
                  </p>
                </div>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -{getCurrencySymbol(row.original.currency)}
                  {row.original.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("nextOccurrence")}:{" "}
                  {row.original.is_active
                    ? format(
                        new Date(row.original.next_occurrence),
                        "MMM d, yyyy",
                      )
                    : "-"}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(row.original)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {tCommon("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onTogglePause?.(row.original)}
                    >
                      {row.original.is_active ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          {t("pause")}
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          {t("resume")}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(row.original)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tCommon("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            {t("noRecurringExpenses")}
          </p>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {displayedRows.length ? (
              displayedRows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b last:border-0 ${
                    !row.original.is_active ? "opacity-60" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {t("noRecurringExpenses")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {recurringExpenses.length > 10 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {t("showingRecurring", {
              from: table.getState().pagination.pageIndex * 10 + 1,
              to: Math.min(
                (table.getState().pagination.pageIndex + 1) * 10,
                recurringExpenses.length,
              ),
              total: recurringExpenses.length,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">
                {tCommon("previous")}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="hidden sm:inline mr-1">{tCommon("next")}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
