"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconPicker,
  IconBadge,
  ColorPicker,
} from "@/components/ui/icon-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CATEGORY_COLORS } from "@/lib/constants";
import type { IncomeCategory } from "@/types/database";

const DEFAULT_INCOME_CATEGORY_COLOR = "#22c55e"; // Green for income

interface IncomeCategoryManagerProps {
  accountId: string;
  incomeCategories: IncomeCategory[];
  onRefresh: () => void;
  isDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function IncomeCategoryManager({
  accountId,
  incomeCategories,
  onRefresh,
  isDialogOpen: controlledIsDialogOpen,
  onDialogOpenChange,
}: IncomeCategoryManagerProps) {
  const t = useTranslations("incomeCategories");
  const tAccounts = useTranslations("accounts");
  const tCommon = useTranslations("common");

  const [internalIsDialogOpen, setInternalIsDialogOpen] = useState(false);
  const isDialogOpen = controlledIsDialogOpen ?? internalIsDialogOpen;
  const setIsDialogOpen = onDialogOpenChange ?? setInternalIsDialogOpen;
  const [editingCategory, setEditingCategory] = useState<IncomeCategory | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<IncomeCategory | null>(null);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("banknote");
  const [color, setColor] = useState<string>(DEFAULT_INCOME_CATEGORY_COLOR);

  const resetForm = () => {
    setName("");
    setIcon("banknote");
    setColor(DEFAULT_INCOME_CATEGORY_COLOR);
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: IncomeCategory) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const url = editingCategory
        ? `/api/income-categories/${editingCategory.id}`
        : "/api/income-categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accountId,
          name: name.trim(),
          icon,
          color,
        }),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        onRefresh();
      }
    } catch (error) {
      console.error("Error saving income category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (category: IncomeCategory) => {
    setCategoryToDelete(category);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(
        `/api/income-categories/${categoryToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting income category:", error);
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {incomeCategories.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">
            {t("noCategories")}
          </p>
        ) : (
          incomeCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-lg border p-2 sm:p-3"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <IconBadge
                  icon={category.icon}
                  color={category.color}
                  size="md"
                />
                <span className="font-medium text-sm sm:text-base truncate">
                  {category.name}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleOpenDialog(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(category)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t("editCategory") : t("addCategory")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="income-category-name">{t("name")}</Label>
              <Input
                id="income-category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{tAccounts("icon")}</Label>
              <IconPicker
                value={icon}
                onChange={setIcon}
                placeholder={tAccounts("selectIcon")}
              />
            </div>

            <div className="space-y-2">
              <Label>{tAccounts("color")}</Label>
              <ColorPicker
                value={color}
                onChange={setColor}
                colors={CATEGORY_COLORS}
                icon={icon}
                columns={6}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingCategory ? tCommon("update") : tCommon("create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={() => setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteCategory")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteCategoryConfirm", {
                name: categoryToDelete?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
