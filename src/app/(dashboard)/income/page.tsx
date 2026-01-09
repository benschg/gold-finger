"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Loader2, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { IncomeForm, IncomeTable } from "@/components/income";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useIncomeCategories } from "@/lib/hooks/use-income-categories";
import { useAccountStore } from "@/store/account-store";
import type { IncomeWithCategory, Currency } from "@/types/database";
import { CURRENCIES } from "@/lib/constants";

export default function IncomePage() {
  const t = useTranslations("income");
  const tCommon = useTranslations("common");
  const [incomes, setIncomes] = useState<IncomeWithCategory[]>([]);
  const [isLoadingIncomes, setIsLoadingIncomes] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeWithCategory | null>(
    null,
  );
  const [incomeToDelete, setIncomeToDelete] =
    useState<IncomeWithCategory | null>(null);
  // Track which account is selected in the form (may differ from page filter)
  const [formAccountId, setFormAccountId] = useState<string | null>(null);

  const {
    accounts,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = useAccounts();
  const { selectedAccountId } = useAccountStore();

  // Use formAccountId when dialog is open, otherwise use selectedAccountId
  const categoriesAccountId = isDialogOpen ? formAccountId : selectedAccountId;
  const { incomeCategories } = useIncomeCategories(categoriesAccountId);

  // Get selected account for its currency
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Fetch incomes when account changes
  const fetchIncomes = useCallback(async () => {
    if (!selectedAccountId) return;

    setIsLoadingIncomes(true);
    try {
      const response = await fetch(
        `/api/incomes?account_id=${selectedAccountId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setIncomes(data);
      }
    } catch (error) {
      console.error("Error fetching incomes:", error);
    } finally {
      setIsLoadingIncomes(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const handleAddIncome = () => {
    setEditingIncome(null);
    setFormAccountId(selectedAccountId);
    setIsDialogOpen(true);
  };

  const handleFormAccountChange = (accountId: string) => {
    setFormAccountId(accountId);
  };

  const handleAddAnother = () => {
    setEditingIncome(null);
    // Keep the same form account for consecutive adds
    fetchIncomes();
  };

  const handleEditIncome = (income: IncomeWithCategory) => {
    setEditingIncome(income);
    setFormAccountId(income.account_id);
    setIsDialogOpen(true);
  };

  const handleDeleteIncome = (income: IncomeWithCategory) => {
    setIncomeToDelete(income);
  };

  const confirmDeleteIncome = async () => {
    if (!incomeToDelete) return;

    try {
      const response = await fetch(`/api/incomes/${incomeToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchIncomes();
      }
    } catch (error) {
      console.error("Error deleting income:", error);
    } finally {
      setIncomeToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setEditingIncome(null);
    fetchIncomes();
  };

  const handleCurrencyChange = async (currency: string) => {
    if (!selectedAccountId) return;

    try {
      const response = await fetch(`/api/accounts/${selectedAccountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });

      if (response.ok) {
        refetchAccounts();
      }
    } catch (error) {
      console.error("Error updating currency:", error);
    }
  };

  if (isLoadingAccounts) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("noAccountsYet")}</p>
        <Button asChild>
          <a href="/accounts">{t("createAnAccount")}</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
            {selectedAccount && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-0.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors">
                    {CURRENCIES.find((c) => c.code === selectedAccount.currency)
                      ?.symbol || selectedAccount.currency}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {CURRENCIES.map((currency) => (
                    <DropdownMenuItem
                      key={currency.code}
                      onClick={() => handleCurrencyChange(currency.code)}
                      className={
                        selectedAccount.currency === currency.code
                          ? "bg-accent"
                          : ""
                      }
                    >
                      {currency.symbol} {currency.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <Button onClick={handleAddIncome} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t("addIncome")}
        </Button>
      </div>

      {isLoadingIncomes ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <IncomeTable
          incomes={incomes}
          onEdit={handleEditIncome}
          onDelete={handleDeleteIncome}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="flex max-h-[90vh] max-w-[calc(100vw-2rem)] flex-col sm:max-w-lg"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {editingIncome ? t("editIncome") : t("addIncome")}
            </DialogTitle>
          </DialogHeader>
          {formAccountId && (
            <IncomeForm
              accountId={formAccountId}
              accounts={accounts}
              accountCurrency={
                selectedAccount?.currency as Currency | undefined
              }
              incomeCategories={incomeCategories}
              income={editingIncome || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsDialogOpen(false)}
              onAccountChange={handleFormAccountChange}
              onAddAnother={editingIncome ? undefined : handleAddAnother}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!incomeToDelete}
        onOpenChange={() => setIncomeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteIncome")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteIncomeConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteIncome}
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
