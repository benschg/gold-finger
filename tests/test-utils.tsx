// Test utilities including providers
import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

// Import English messages for tests
import messages from "../messages/en.json";

// Create a wrapper with NextIntlClientProvider for i18n support
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider messages={messages} locale="en">
      {children}
    </NextIntlClientProvider>
  );
}

// Custom render function that includes providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react";
