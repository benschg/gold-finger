"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DevTools } from "@/components/layout/dev-tools";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/gold-finger.svg" alt="Gold-Finger" width={24} height={24} />
          <span className="text-xl font-bold">Gold-Finger</span>
        </Link>

        <nav className="flex items-center gap-4">
          <DevTools />
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
