import { test, expect } from "@playwright/test";

const PUBLIC_PAGES = [
  { path: "/support/faq", name: "FAQ" },
  { path: "/privacy", name: "개인정보처리방침" },
  { path: "/terms", name: "이용약관" },
];

test.describe("공개 페이지", () => {
  for (const { path, name } of PUBLIC_PAGES) {
    test(`${name} (${path})가 정상 로드된다`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");
      const title = await page.title();
      expect(title).not.toContain("500");
    });

    test(`${name} (${path})에 콘텐츠가 있다`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.length).toBeGreaterThan(10);
    });

    test(`${name} (${path})는 비인증으로 접근 가능하다`, async ({ page }) => {
      await page.context().clearCookies();
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");
      const title = await page.title();
      expect(title).not.toContain("500");
    });
  }
});
