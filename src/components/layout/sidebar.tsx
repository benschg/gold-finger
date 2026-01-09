"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Menu,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItemsConfig = [
  {
    key: "dashboard" as const,
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "expenses" as const,
    href: "/expenses",
    icon: Receipt,
  },
  {
    key: "income" as const,
    href: "/income",
    icon: TrendingUp,
  },
  {
    key: "settings" as const,
    href: "/settings",
    icon: Settings,
  },
  {
    key: "sharing" as const,
    href: "/sharing",
    icon: Share2,
  },
];

const bottomNavItemsConfig = [
  {
    key: "accounts" as const,
    href: "/accounts",
    icon: Users,
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("navigation");
  const tCommon = useTranslations("common");

  // Get account param to preserve across navigation
  const accountId = searchParams.get("account");

  // Build href with account param preserved (except for /accounts page)
  const buildHref = (href: string) => {
    if (!accountId || href === "/accounts") return href;
    return `${href}?account=${accountId}`;
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link
          href={buildHref("/dashboard")}
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <Image
            src="/gold-finger-logo.svg"
            alt={tCommon("appName")}
            width={24}
            height={24}
          />
          <span className="text-xl font-bold">{tCommon("appName")}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItemsConfig.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={buildHref(item.href)}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      {/* Bottom navigation */}
      <div className="space-y-1 p-4 pt-0">
        {bottomNavItemsConfig.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={buildHref(item.href)}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          );
        })}
      </div>

      {/* Sign out */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </Button>
      </div>
    </div>
  );
}

// Desktop Sidebar - hidden on mobile
export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-background md:block">
      <SidebarContent />
    </aside>
  );
}

// Mobile Sidebar - Sheet drawer
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("navigation");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("toggleMenu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{t("navigationMenu")}</SheetTitle>
        </SheetHeader>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
