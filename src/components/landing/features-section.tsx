import {
  Wallet,
  Tag,
  Globe,
  Moon,
  Shield,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Multiple Accounts",
    description:
      "Create separate accounts for personal, household, or work expenses. Keep your finances organized.",
  },
  {
    icon: Tag,
    title: "Categories & Tags",
    description:
      "Organize expenses with custom categories and tags like vacation, work, or home.",
  },
  {
    icon: Globe,
    title: "Multi-Currency",
    description:
      "Track expenses in any currency with automatic conversion to your preferred currency.",
  },
  {
    icon: Moon,
    title: "Dark Mode",
    description:
      "Easy on the eyes with full dark mode support. Switch anytime.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your data is encrypted and protected. No password needed - just a secure magic link.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description:
      "Access your expenses from any device. Works beautifully on desktop and mobile.",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t bg-muted/50 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Everything you need to manage expenses
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built with modern tools for the best experience
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="gold-shimmer-card rounded-lg border bg-background p-6 transition-shadow hover:shadow-lg"
            >
              <feature.icon className="h-8 w-8 text-yellow-500" />
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
