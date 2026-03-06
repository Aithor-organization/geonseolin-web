import { Page, expect } from "@playwright/test";

export const DEMO_ACCOUNTS = {
  worker: { email: "demo.worker1@test.com", password: "demo1234" },
  company: { email: "demo.company1@test.com", password: "demo1234" },
} as const;

export async function login(page: Page, role: "worker" | "company" = "worker") {
  const account = DEMO_ACCOUNTS[role];
  await page.goto("/login");
  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10_000 });
}

export async function assertNoServerError(page: Page) {
  const title = await page.title();
  expect(title).not.toContain("500");
  expect(title).not.toContain("Error");
}
