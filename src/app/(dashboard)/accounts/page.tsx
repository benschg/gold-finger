"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus, Loader2, Users, Receipt } from "lucide-react";

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
import {
  AccountCard,
  CreateAccountDialog,
  ManageAccountDialog,
} from "@/components/accounts";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { createClient } from "@/lib/supabase/client";
import type { AccountWithRole } from "@/types/database";

interface DeleteAccountDetails {
  memberCount: number;
  expenseCount: number;
  isLoading: boolean;
}

export default function AccountsPage() {
  const t = useTranslations("accounts");
  const tCommon = useTranslations("common");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] =
    useState<AccountWithRole | null>(null);
  const [accountToManage, setAccountToManage] =
    useState<AccountWithRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [deleteDetails, setDeleteDetails] = useState<DeleteAccountDetails>({
    memberCount: 0,
    expenseCount: 0,
    isLoading: false,
  });
  const { accounts, isLoading, refetch } = useAccounts();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
      }
    });
  }, []);

  // Fetch account details when delete dialog opens
  useEffect(() => {
    if (!accountToDelete) {
      setDeleteDetails({ memberCount: 0, expenseCount: 0, isLoading: false });
      return;
    }

    const fetchDetails = async () => {
      setDeleteDetails((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await fetch(`/api/accounts/${accountToDelete.id}`);
        if (response.ok) {
          const data = await response.json();
          setDeleteDetails({
            memberCount: data.members?.length ?? 0,
            expenseCount: data.expense_count ?? 0,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Error fetching account details:", error);
        setDeleteDetails((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchDetails();
  }, [accountToDelete]);

  const handleDeleteAccount = (account: AccountWithRole) => {
    setAccountToDelete(account);
  };

  const handleManageAccount = (account: AccountWithRole) => {
    setAccountToManage(account);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("newAccount")}
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onDelete={handleDeleteAccount}
            onManage={handleManageAccount}
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
              <span>{t("createAccount")}</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <CreateAccountDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={refetch}
      />

      <ManageAccountDialog
        account={accountToManage}
        open={!!accountToManage}
        onOpenChange={(open) => !open && setAccountToManage(null)}
        onSuccess={refetch}
        currentUserId={currentUserId}
      />

      <AlertDialog
        open={!!accountToDelete}
        onOpenChange={() => setAccountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAccount")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {t("deleteAccountConfirm", {
                    name: accountToDelete?.name ?? "",
                  })}
                </p>

                {deleteDetails.isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("loadingAccountDetails")}</span>
                  </div>
                ) : (
                  <div className="rounded-md border bg-muted/50 p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {t("permanentlyDeleted")}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      <span>
                        {t("membersWillLoseAccess", {
                          count: deleteDetails.memberCount,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Receipt className="h-4 w-4" />
                      <span>
                        {t("expensesWillBeDeleted", {
                          count: deleteDetails.expenseCount,
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
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
