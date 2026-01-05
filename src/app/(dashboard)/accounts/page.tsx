"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { AccountCard, CreateAccountDialog } from "@/components/accounts";
import { useAccounts } from "@/lib/hooks/use-accounts";
import type { Tables } from "@/types/database.types";

type Account = Tables<"accounts">;

interface AccountWithRole extends Account {
  role: "owner" | "member";
}

export default function AccountsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<AccountWithRole | null>(null);
  const { accounts, isLoading, refetch } = useAccounts();

  const handleDeleteAccount = (account: AccountWithRole) => {
    setAccountToDelete(account);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      const response = await fetch(`/api/accounts/${accountToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setAccountToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your expense accounts and sharing
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onDelete={handleDeleteAccount}
          />
        ))}

        <Card className="border-dashed">
          <CardContent className="flex h-full min-h-32 items-center justify-center p-6">
            <Button
              variant="ghost"
              className="h-auto flex-col gap-2"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-8 w-8" />
              <span>Create new account</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <CreateAccountDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={refetch}
      />

      <AlertDialog
        open={!!accountToDelete}
        onOpenChange={() => setAccountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{accountToDelete?.name}&quot;? This will
              permanently delete all expenses and data associated with this account.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
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
