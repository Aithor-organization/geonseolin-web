import { test, expect } from "@playwright/test";

test.describe("로그인 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
  });

  test("페이지가 정상 로드된다", async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    const title = await page.title();
    expect(title).not.toContain("500");
  });

  test("이메일 입력 필드가 존재한다", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test("비밀번호 입력 필드가 존재한다", async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
  });

  test("로그인 버튼이 존재한다", async ({ page }) => {
    const btn = page.locator('button[type="submit"]').first();
    await expect(btn).toBeVisible();
  });

  test("빈 폼 제출 시 로그인 페이지에 머문다", async ({ page }) => {
    const btn = page.locator('button[type="submit"]').first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toMatch(/login/i);
    }
  });
});

test.describe("회원가입 페이지", () => {
  test("정상 로드된다", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForLoadState("domcontentloaded");
    const title = await page.title();
    expect(title).not.toContain("404");
    expect(title).not.toContain("500");
  });
});
