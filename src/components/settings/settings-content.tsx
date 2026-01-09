"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountDetailsSection } from "./account-details-section";
import { CategoryManager } from "./category-manager";
import { IncomeCategoryManager } from "./income-category-manager";
import { TagManager } from "./tag-manager";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useIncomeCategories } from "@/lib/hooks/use-income-categories";
import { useTags } from "@/lib/hooks/use-tags";
import { useAccountStore } from "@/store/account-store";

export function SettingsContent() {
  const t = useTranslations("accountSettings");
  const tCategories = useTranslations("categories");
  const tIncomeCategories = useTranslations("incomeCategories");
  const tTags = useTranslations("tags");

  const {
    accounts,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = useAccounts();
  const { selectedAccountId } = useAccountStore();

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const {
    categories,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useCategories(selectedAccountId);

  const {
    tags,
    isLoading: isLoadingTags,
    refetch: refetchTags,
  } = useTags(selectedAccountId);

  const {
    incomeCategories,
    isLoading: isLoadingIncomeCategories,
    refetch: refetchIncomeCategories,
  } = useIncomeCategories(selectedAccountId);

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isIncomeCategoryDialogOpen, setIsIncomeCategoryDialogOpen] =
    useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  if (isLoadingAccounts) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("noAccountsYet")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Details */}
      {selectedAccount && (
        <Card>
          <CardHeader>
            <CardTitle>{t("accountDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountDetailsSection
              account={selectedAccount}
              onSuccess={refetchAccounts}
            />
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      {selectedAccountId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{tCategories("title")}</CardTitle>
            <Button size="sm" onClick={() => setIsCategoryDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {tCategories("addCategory")}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingCategories ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CategoryManager
                accountId={selectedAccountId}
                categories={categories}
                onRefresh={refetchCategories}
                isDialogOpen={isCategoryDialogOpen}
                onDialogOpenChange={setIsCategoryDialogOpen}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Income Categories */}
      {selectedAccountId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{tIncomeCategories("title")}</CardTitle>
            <Button
              size="sm"
              onClick={() => setIsIncomeCategoryDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {tIncomeCategories("addCategory")}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingIncomeCategories ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <IncomeCategoryManager
                accountId={selectedAccountId}
                incomeCategories={incomeCategories}
                onRefresh={refetchIncomeCategories}
                isDialogOpen={isIncomeCategoryDialogOpen}
                onDialogOpenChange={setIsIncomeCategoryDialogOpen}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {selectedAccountId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{tTags("title")}</CardTitle>
            <Button size="sm" onClick={() => setIsTagDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {tTags("addTag")}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingTags ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TagManager
                accountId={selectedAccountId}
                tags={tags}
                onRefresh={refetchTags}
                isDialogOpen={isTagDialogOpen}
                onDialogOpenChange={setIsTagDialogOpen}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
