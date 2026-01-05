"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-yellow-500" />
          <span className="text-xl font-bold">Gold-Finger</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
