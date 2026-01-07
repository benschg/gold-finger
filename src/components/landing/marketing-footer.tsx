import Link from "next/link";
import Image from "next/image";

export function MarketingFooter() {
  return (
    <footer className="border-t py-12">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/gold-finger.svg"
              alt="Gold-Finger"
              width={20}
              height={20}
            />
            <span className="font-semibold">Gold-Finger</span>
          </Link>

          <p className="text-sm text-muted-foreground">
            Track your expenses with golden precision.
          </p>
        </div>
      </div>
    </footer>
  );
}
