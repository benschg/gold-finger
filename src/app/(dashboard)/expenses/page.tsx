"use client";

import { useState, useEffect, useCallback } from "react";
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
import { ExpenseForm, ExpenseTable } from "@/components/expenses";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTags } from "@/lib/hooks/use-tags";
import { useAccountStore } from "@/store/account-store";
import type { ExpenseWithDetails, Currency } from "@/types/database";
import { CURRENCIES } from "@/lib/constants";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] =
    useState<ExpenseWithDetails | null>(null);
  const [expenseToDelete, setExpenseToDelete] =
    useState<ExpenseWithDetails | null>(null);
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
  const { categories } = useCategories(categoriesAccountId);
  const { tags } = useTags(categoriesAccountId);

  // Get selected account for its currency
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Fetch expenses when account changes
  const fetchExpenses = useCallback(async () => {
    if (!selectedAccountId) return;

    setIsLoadingExpenses(true);
    try {
      const response = await fetch(
        `/api/expenses?account_id=${selectedAccountId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoadingExpenses(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAddExpense = () => {
    setEditingExpense(null);
    setFormAccountId(selectedAccountId);
    setIsDialogOpen(true);
  };

  const handleFormAccountChange = (accountId: string) => {
    setFormAccountId(accountId);
  };

  const handleAddAnother = () => {
    setEditingExpense(null);
    // Keep the same form account for consecutive adds
    fetchExpenses();
  };

  const handleEditExpense = (expense: ExpenseWithDetails) => {
    setEditingExpense(expense);
    setFormAccountId(expense.account_id);
    setIsDialogOpen(true);
  };

  const handleDeleteExpense = (expense: ExpenseWithDetails) => {
    setExpenseToDelete(expense);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
    } finally {
      setExpenseToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
    fetchExpenses();
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
        <p className="text-muted-foreground">
          You don&apos;t have any accounts yet.
        </p>
        <Button asChild>
          <a href="/accounts">Create an Account</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Expenses</h1>
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
            Track and manage your expenses
          </p>
        </div>

        <Button onClick={handleAddExpense} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {isLoadingExpenses ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ExpenseTable
          expenses={expenses}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-[calc(100vw-2rem)] sm:max-w-lg"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </DialogTitle>
          </DialogHeader>
          {formAccountId && (
            <ExpenseForm
              accountId={formAccountId}
              accounts={accounts}
              accountCurrency={
                selectedAccount?.currency as Currency | undefined
              }
              categories={categories}
              tags={tags}
              expense={editingExpense || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsDialogOpen(false)}
              onAccountChange={handleFormAccountChange}
              onAddAnother={editingExpense ? undefined : handleAddAnother}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!expenseToDelete}
        onOpenChange={() => setExpenseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
