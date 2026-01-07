import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <div className="md:pl-64">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
