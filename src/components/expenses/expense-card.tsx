"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import type { ExpenseWithDetails, ExpenseWithItems } from "@/types/database";

export const currencySymbols: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

interface ExpenseCardProps {
  expense: ExpenseWithDetails | ExpenseWithItems;
  onEdit?: (expense: ExpenseWithDetails | ExpenseWithItems) => void;
  onDelete?: (expense: ExpenseWithDetails | ExpenseWithItems) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("expenses");
  const [showItems, setShowItems] = useState(false);

  const symbol = currencySymbols[expense.currency] || expense.currency;
  const category = expense.category;
  const tags = expense.tags || [];
  const expenseWithItems = expense as ExpenseWithItems;
  const hasItems = expense.has_items && expenseWithItems.items?.length > 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">
                {format(new Date(expense.date), "MMM d, yyyy")}
              </span>
              {category && (
                <span className="flex items-center gap-1 text-xs">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color ?? "#6366f1" }}
                  />
                  {category.name}
                </span>
              )}
            </div>
            <p className="font-medium truncate">
              {expense.description || tCommon("noDescription")}
            </p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full px-2 py-0.5 text-xs text-white"
                    style={{ backgroundColor: tag.color ?? "#6366f1" }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            {hasItems && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowItems(!showItems)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showItems ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {t("itemsCount", { count: expenseWithItems.items.length })}
                </button>
                {showItems && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {expenseWithItems.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between text-muted-foreground"
                      >
                        <span>
                          {item.quantity > 1 && `${item.quantity}x `}
                          {item.name}
                        </span>
                        <span>
                          {symbol}
                          {item.total_price.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold whitespace-nowrap">
              {symbol}
              {expense.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{tCommon("openMenu")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(expense)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {tCommon("edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(expense)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tCommon("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
