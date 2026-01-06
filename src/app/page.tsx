import {
  MarketingHeader,
  HeroSection,
  FeaturesSection,
  MarketingFooter,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
