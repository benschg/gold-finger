import { Suspense } from "react";
import { VerifyForm } from "@/components/auth/verify-form";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Verify | Gold-Finger",
  description: "Verify your email to sign in",
};

function VerifyFormFallback() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<VerifyFormFallback />}>
        <VerifyForm />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline hover:text-primary">
          Use a different email
        </Link>
      </p>
    </div>
  );
}
