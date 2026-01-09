"use client";

import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrencySymbol } from "@/lib/constants";
import type { IncomeWithCategory } from "@/types/database";

interface IncomeCardProps {
  income: IncomeWithCategory;
  onEdit?: (income: IncomeWithCategory) => void;
  onDelete?: (income: IncomeWithCategory) => void;
}

export function IncomeCard({ income, onEdit, onDelete }: IncomeCardProps) {
  const tCommon = useTranslations("common");

  const symbol = getCurrencySymbol(income.currency);
  const category = income.income_category;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">
                {format(new Date(income.date), "MMM d, yyyy")}
              </span>
              {category && (
                <span className="flex items-center gap-1 text-xs">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color ?? "#22c55e" }}
                  />
                  {category.name}
                </span>
              )}
            </div>
            <p className="font-medium truncate">
              {income.description || tCommon("noDescription")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold whitespace-nowrap text-green-600 dark:text-green-400">
              +{symbol}
              {income.amount.toLocaleString(undefined, {
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
                <DropdownMenuItem onClick={() => onEdit?.(income)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {tCommon("edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(income)}
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
