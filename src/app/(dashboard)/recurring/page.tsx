"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RecurringExpenseForm,
  RecurringExpenseTable,
  RecurringIncomeForm,
  RecurringIncomeTable,
} from "@/components/recurring";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useIncomeCategories } from "@/lib/hooks/use-income-categories";
import { useAccountStore } from "@/store/account-store";
import type {
  RecurringExpenseWithCategory,
  RecurringIncomeWithCategory,
  Currency,
} from "@/types/database";

type TabValue = "expenses" | "income";

export default function RecurringPage() {
  const t = useTranslations("recurring");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState<TabValue>("expenses");
  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpenseWithCategory[]
  >([]);
  const [recurringIncomes, setRecurringIncomes] = useState<
    RecurringIncomeWithCategory[]
  >([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isLoadingIncomes, setIsLoadingIncomes] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] =
    useState<RecurringExpenseWithCategory | null>(null);
  const [editingIncome, setEditingIncome] =
    useState<RecurringIncomeWithCategory | null>(null);
  const [expenseToDelete, setExpenseToDelete] =
    useState<RecurringExpenseWithCategory | null>(null);
  const [incomeToDelete, setIncomeToDelete] =
    useState<RecurringIncomeWithCategory | null>(null);
  const [formAccountId, setFormAccountId] = useState<string | null>(null);

  const { accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { selectedAccountId } = useAccountStore();
  const { categories } = useCategories(formAccountId || selectedAccountId);
  const { incomeCategories } = useIncomeCategories(
    formAccountId || selectedAccountId,
  );

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Fetch recurring expenses
  const fetchRecurringExpenses = useCallback(async () => {
    if (!selectedAccountId) return;

    setIsLoadingExpenses(true);
    try {
      const response = await fetch(
        `/api/recurring-expenses?account_id=${selectedAccountId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setRecurringExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching recurring expenses:", error);
    } finally {
      setIsLoadingExpenses(false);
    }
  }, [selectedAccountId]);

  // Fetch recurring incomes
  const fetchRecurringIncomes = useCallback(async () => {
    if (!selectedAccountId) return;

    setIsLoadingIncomes(true);
    try {
      const response = await fetch(
        `/api/recurring-incomes?account_id=${selectedAccountId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setRecurringIncomes(data);
      }
    } catch (error) {
      console.error("Error fetching recurring incomes:", error);
    } finally {
      setIsLoadingIncomes(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchRecurringExpenses();
    fetchRecurringIncomes();
  }, [fetchRecurringExpenses, fetchRecurringIncomes]);

  // Expense handlers
  const handleAddExpense = () => {
    setEditingExpense(null);
    setFormAccountId(selectedAccountId);
    setIsExpenseDialogOpen(true);
  };

  const handleEditExpense = (expense: RecurringExpenseWithCategory) => {
    setEditingExpense(expense);
    setFormAccountId(expense.account_id);
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteExpense = (expense: RecurringExpenseWithCategory) => {
    setExpenseToDelete(expense);
  };

  const handleTogglePauseExpense = async (
    expense: RecurringExpenseWithCategory,
  ) => {
    try {
      await fetch(`/api/recurring-expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !expense.is_active }),
      });
      fetchRecurringExpenses();
    } catch (error) {
      console.error("Error toggling pause:", error);
    }
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      const response = await fetch(
        `/api/recurring-expenses/${expenseToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        fetchRecurringExpenses();
      }
    } catch (error) {
      console.error("Error deleting recurring expense:", error);
    } finally {
      setExpenseToDelete(null);
    }
  };

  // Income handlers
  const handleAddIncome = () => {
    setEditingIncome(null);
    setFormAccountId(selectedAccountId);
    setIsIncomeDialogOpen(true);
  };

  const handleEditIncome = (income: RecurringIncomeWithCategory) => {
    setEditingIncome(income);
    setFormAccountId(income.account_id);
    setIsIncomeDialogOpen(true);
  };

  const handleDeleteIncome = (income: RecurringIncomeWithCategory) => {
    setIncomeToDelete(income);
  };

  const handleTogglePauseIncome = async (
    income: RecurringIncomeWithCategory,
  ) => {
    try {
      await fetch(`/api/recurring-incomes/${income.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !income.is_active }),
      });
      fetchRecurringIncomes();
    } catch (error) {
      console.error("Error toggling pause:", error);
    }
  };

  const confirmDeleteIncome = async () => {
    if (!incomeToDelete) return;

    try {
      const response = await fetch(
        `/api/recurring-incomes/${incomeToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        fetchRecurringIncomes();
      }
    } catch (error) {
      console.error("Error deleting recurring income:", error);
    } finally {
      setIncomeToDelete(null);
    }
  };

  const handleExpenseFormSuccess = () => {
    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
    fetchRecurringExpenses();
  };

  const handleIncomeFormSuccess = () => {
    setIsIncomeDialogOpen(false);
    setEditingIncome(null);
    fetchRecurringIncomes();
  };

  const handleFormAccountChange = (accountId: string) => {
    setFormAccountId(accountId);
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
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <Button
          onClick={
            activeTab === "expenses" ? handleAddExpense : handleAddIncome
          }
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === "expenses"
            ? t("addRecurringExpense")
            : t("addRecurringIncome")}
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-[300px]">
          <TabsTrigger value="expenses">{t("expenses")}</TabsTrigger>
          <TabsTrigger value="income">{t("income")}</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-6">
          {isLoadingExpenses ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RecurringExpenseTable
              recurringExpenses={recurringExpenses}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              onTogglePause={handleTogglePauseExpense}
            />
          )}
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          {isLoadingIncomes ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RecurringIncomeTable
              recurringIncomes={recurringIncomes}
              onEdit={handleEditIncome}
              onDelete={handleDeleteIncome}
              onTogglePause={handleTogglePauseIncome}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent
          className="flex max-h-[90vh] max-w-[calc(100vw-2rem)] flex-col sm:max-w-lg"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {editingExpense
                ? t("editRecurringExpense")
                : t("addRecurringExpense")}
            </DialogTitle>
          </DialogHeader>
          {formAccountId && (
            <RecurringExpenseForm
              accountId={formAccountId}
              accounts={accounts}
              accountCurrency={
                selectedAccount?.currency as Currency | undefined
              }
              categories={categories}
              recurringExpense={editingExpense || undefined}
              onSuccess={handleExpenseFormSuccess}
              onCancel={() => setIsExpenseDialogOpen(false)}
              onAccountChange={handleFormAccountChange}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Income Dialog */}
      <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
        <DialogContent
          className="flex max-h-[90vh] max-w-[calc(100vw-2rem)] flex-col sm:max-w-lg"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {editingIncome
                ? t("editRecurringIncome")
                : t("addRecurringIncome")}
            </DialogTitle>
          </DialogHeader>
          {formAccountId && (
            <RecurringIncomeForm
              accountId={formAccountId}
              accounts={accounts}
              accountCurrency={
                selectedAccount?.currency as Currency | undefined
              }
              incomeCategories={incomeCategories}
              recurringIncome={editingIncome || undefined}
              onSuccess={handleIncomeFormSuccess}
              onCancel={() => setIsIncomeDialogOpen(false)}
              onAccountChange={handleFormAccountChange}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Expense Confirmation */}
      <AlertDialog
        open={!!expenseToDelete}
        onOpenChange={() => setExpenseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteRecurringExpense")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteRecurringExpenseConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Income Confirmation */}
      <AlertDialog
        open={!!incomeToDelete}
        onOpenChange={() => setIncomeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteRecurringIncome")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteRecurringIncomeConfirm")}
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
