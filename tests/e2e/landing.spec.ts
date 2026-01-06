import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should display the landing page", async ({ page }) => {
    await page.goto("/");

    // Check that the page loads
    await expect(page).toHaveTitle(/Gold-Finger/);
  });

  test("should have a login button", async ({ page }) => {
    await page.goto("/");

    // Look for a login/sign in link or button
    const loginButton = page.getByRole("link", { name: /login|sign in/i });
    await expect(loginButton).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Click login and verify navigation
    await page.getByRole("link", { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Authentication", () => {
  test("should show OTP form on login page", async ({ page }) => {
    await page.goto("/login");

    // Check for email input
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
  });
});
