"use client";

import { Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccountSelector } from "@/components/accounts";
import { CategoryManager } from "./category-manager";
import { TagManager } from "./tag-manager";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTags } from "@/lib/hooks/use-tags";
import { useAccountUrlSync } from "@/hooks/use-account-url-sync";
import { useAccountStore } from "@/store/account-store";

export function SettingsCategoriesTags() {
  const { accounts, isLoading: isLoadingAccounts } = useAccounts();

  // Sync account selection with URL
  useAccountUrlSync(accounts);
  const { selectedAccountId, setSelectedAccountId } = useAccountStore();

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

  if (isLoadingAccounts) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Create an account first to manage categories and tags.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories & Tags</CardTitle>
        <CardDescription>
          Manage categories and tags for your expenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-w-xs">
          <AccountSelector
            accounts={accounts}
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
            showIcon={false}
          />
        </div>

        {selectedAccountId && (
          <>
            {isLoadingCategories ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CategoryManager
                accountId={selectedAccountId}
                categories={categories}
                onRefresh={refetchCategories}
              />
            )}

            <hr />

            {isLoadingTags ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TagManager
                accountId={selectedAccountId}
                tags={tags}
                onRefresh={refetchTags}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
