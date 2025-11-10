import { test, expect } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@ticketsystem.com";

test.describe("Login page", () => {
  test("should render login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Sistema HelpDesk" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
  });

  test("should keep email typed by user", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByLabel("Email");
    await emailInput.fill(adminEmail);
    await expect(emailInput).toHaveValue(adminEmail);
  });
});
