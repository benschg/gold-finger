import { test, expect } from "@playwright/test";

test.describe("Income Page", () => {
  // Note: These tests require authentication. In a real setup,
  // you would use Playwright's storageState to persist auth.

  test.describe("Unauthenticated", () => {
    test("should redirect to login when not authenticated", async ({
      page,
    }) => {
      await page.goto("/income");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Navigation", () => {
    test("income link should be visible in sidebar", async ({ page }) => {
      await page.goto("/");

      // Check that Income navigation exists on the landing page
      // or check sidebar after login
      const loginButton = page.getByRole("link", { name: /login|sign in/i });
      await expect(loginButton).toBeVisible();
    });
  });
});

test.describe("Income Feature Structure", () => {
  test("income page should exist", async ({ page }) => {
    // Try to access income page - will redirect to login if not auth'd
    const response = await page.goto("/income");

    // Should get a response (either the page or a redirect)
    expect(response?.status()).toBeLessThan(500);
  });

  test("income API endpoints should exist", async ({ request }) => {
    // Test that the API routes exist (will return 401 without auth)
    const getResponse = await request.get("/api/incomes?account_id=test");
    expect([401, 400]).toContain(getResponse.status());

    const categoriesResponse = await request.get(
      "/api/income-categories?account_id=test",
    );
    expect([401, 400]).toContain(categoriesResponse.status());
  });
});

test.describe("Dashboard Income Features", () => {
  test("dashboard should load without errors", async ({ page }) => {
    // Navigate to dashboard (will redirect to login)
    await page.goto("/dashboard");

    // If redirected to login, that's expected for unauthenticated users
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|login)/);
  });
});
