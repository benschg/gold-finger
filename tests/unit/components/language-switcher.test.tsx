import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../messages/en.json";

// Mock the locale store
const mockSetLocale = vi.fn();
let mockLocale = "en";

vi.mock("@/store/locale-store", () => ({
  useLocaleStore: vi.fn(() => ({
    locale: mockLocale,
    setLocale: mockSetLocale,
  })),
}));

// Import after mocking
import { LanguageSwitcher } from "@/components/layout/language-switcher";

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider messages={messages} locale="en">
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    mockLocale = "en";
    mockSetLocale.mockClear();
  });

  it("renders the language switcher button", () => {
    renderWithProviders(<LanguageSwitcher />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("shows language accessibility label", () => {
    renderWithProviders(<LanguageSwitcher />);
    expect(screen.getByText("Language")).toBeInTheDocument();
  });

  it("opens dropdown menu when clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    const button = screen.getByRole("button");
    await user.click(button);

    // Check that language options are visible
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Deutsch")).toBeInTheDocument();
    expect(screen.getByText("Português")).toBeInTheDocument();
  });

  it("does not show Kannada in public locales", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    const button = screen.getByRole("button");
    await user.click(button);

    // Kannada should not be visible (it's dev-only via DevTools)
    expect(screen.queryByText("ಕನ್ನಡ")).not.toBeInTheDocument();
  });

  it("calls setLocale when a language is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    const button = screen.getByRole("button");
    await user.click(button);

    const deutschOption = screen.getByText("Deutsch");
    await user.click(deutschOption);

    expect(mockSetLocale).toHaveBeenCalledWith("de");
  });

  it("does not call setLocale when clicking the current language", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    const button = screen.getByRole("button");
    await user.click(button);

    const englishOption = screen.getByText("English");
    await user.click(englishOption);

    // Should not call setLocale since 'en' is already selected
    expect(mockSetLocale).not.toHaveBeenCalled();
  });

  it("highlights the currently selected language", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    const button = screen.getByRole("button");
    await user.click(button);

    // The English option should have the bg-accent class
    const englishOption = screen
      .getByText("English")
      .closest('[role="menuitem"]');
    expect(englishOption).toHaveClass("bg-accent");
  });
});
