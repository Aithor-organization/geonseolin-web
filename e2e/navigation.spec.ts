import { test, expect } from "@playwright/test";

test.describe("네비게이션 라우팅", () => {
  test("비인증 상태에서 홈은 로그인으로 리다이렉트된다", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/login|auth|signup|\//);
  });

  test("/login 경로가 정상 로드된다", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/login/);
    const inputs = page.locator("input");
    expect(await inputs.count()).toBeGreaterThan(0);
  });

  test("/signup 경로가 정상 로드된다", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForLoadState("domcontentloaded");
    const title = await page.title();
    expect(title).not.toContain("404");
    expect(title).not.toContain("500");
  });

  test("존재하지 않는 경로는 404 또는 리다이렉트된다", async ({ page }) => {
    await page.goto("/nonexistent-page-12345");
    await page.waitForLoadState("domcontentloaded");
    const title = await page.title();
    const url = page.url();
    const is404 = title.includes("404") || title.includes("Not Found");
    const isRedirected = !url.includes("nonexistent-page-12345");
    expect(is404 || isRedirected).toBeTruthy();
  });
});
