import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Accounts | Gold-Finger",
  description: "Manage your expense accounts",
};

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your expense accounts and sharing
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your default personal account
            </p>
            <div className="mt-4">
              <p className="text-2xl font-bold">€0.00</p>
              <p className="text-xs text-muted-foreground">Total expenses</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex h-full items-center justify-center p-6">
            <Button variant="ghost" className="h-auto flex-col gap-2">
              <Plus className="h-8 w-8" />
              <span>Create new account</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
