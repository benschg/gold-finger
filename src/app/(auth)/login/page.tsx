import { OTPForm } from "@/components/auth/otp-form";
import Link from "next/link";

export const metadata = {
  title: "Sign In | Gold-Finger",
  description: "Sign in to your Gold-Finger account",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Gold-Finger</h1>
        <p className="text-muted-foreground mt-2">
          Track your expenses with ease
        </p>
      </div>

      <OTPForm />

      <p className="text-center text-sm text-muted-foreground">
        By signing in, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-primary">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
