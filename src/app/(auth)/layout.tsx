import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="flex justify-end p-4">
        <LanguageSwitcher />
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
