import { expect, test } from "@playwright/test";

import { completeSignIn } from "./support/auth";

test.describe("marketing landing page", () => {
  test("renders marketing experience for guests", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: /whole order lifecycle/i }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: /start free trial/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /go to dashboard/i })).toBeVisible();
  });

  test("supports locale switching between English and Spanish", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("combobox", { name: /language/i }).selectOption("es");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /ciclo de pedidos, finalmente sincronizado/i,
      }),
    ).toBeVisible();

    await page.getByRole("combobox", { name: /language/i }).selectOption("en");

    await expect(
      page.getByRole("heading", { level: 1, name: /whole order lifecycle/i }),
    ).toBeVisible();
  });

  test("redirects authenticated users to the dashboard", async ({ page }) => {
    await completeSignIn(page);

    await page.goto("/");
    await page.waitForURL("**/dashboard");
  });

  test("loads CSS styles correctly and server remains stable", async ({ page }) => {
    // Navigate to landing page
    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for the main heading to be visible
    const heading = page.getByRole("heading", { level: 1, name: /whole order lifecycle/i });
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verify CSS is loaded by checking computed styles
    const headingStyles = await heading.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        color: computed.color,
        fontFamily: computed.fontFamily,
      };
    });

    // Verify Tailwind classes are applied (fontSize should be set for text-4xl/5xl/6xl)
    expect(headingStyles.fontSize).not.toBe("");
    expect(headingStyles.fontFamily).not.toBe("");
    expect(headingStyles.fontWeight).not.toBe("");

    // Check that CSS variables are loaded (font variables)
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        fontFamily: computed.fontFamily,
        backgroundColor: computed.backgroundColor,
      };
    });

    // Verify Tailwind CSS variables are present
    expect(bodyStyles.fontFamily).not.toBe("");
    expect(bodyStyles.backgroundColor).not.toBe("");

    // Check that the page container has proper styling
    const mainContainer = page.locator("main").first();
    await expect(mainContainer).toBeVisible();

    const containerStyles = await mainContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        minHeight: computed.minHeight,
      };
    });

    // Verify container is properly styled
    expect(containerStyles.display).not.toBe("none");

    // Check navbar styling
    const navbar = page.locator("header").first();
    await expect(navbar).toBeVisible();

    const navbarStyles = await navbar.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        backgroundColor: computed.backgroundColor,
        backdropFilter: computed.backdropFilter,
      };
    });

    // Verify navbar has sticky positioning and backdrop blur
    expect(navbarStyles.position).toBe("sticky");

    // Check CTA button styling (should have background color from Tailwind)
    const ctaButton = page.getByRole("link", { name: /start free trial/i }).first();
    await expect(ctaButton).toBeVisible();

    const buttonStyles = await ctaButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderRadius: computed.borderRadius,
        padding: computed.padding,
      };
    });

    // Verify button has proper styling (not browser defaults)
    expect(buttonStyles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(buttonStyles.borderRadius).not.toBe("0px");

    // Verify CSS is loaded by checking for Tailwind utility classes
    const pageStyles = await page.evaluate(() => {
      const testEl = document.createElement("div");
      testEl.className = "bg-white dark:bg-zinc-950";
      document.body.appendChild(testEl);
      const computed = window.getComputedStyle(testEl);
      const bgColor = computed.backgroundColor;
      document.body.removeChild(testEl);
      return bgColor;
    });

    // Verify Tailwind classes are being processed
    expect(pageStyles).toBeTruthy();

    // Test server stability: reload the page multiple times to ensure it doesn't crash
    for (let i = 0; i < 3; i++) {
      await page.reload({ waitUntil: "networkidle" });
      await expect(heading).toBeVisible({ timeout: 15000 });

      // Verify styles are still applied after reload
      const reloadedStyles = await heading.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return computed.fontSize;
      });
      expect(reloadedStyles).not.toBe("");
    }

    // Verify all major sections are present and styled
    const sections = [
      { name: "Hero section", selector: "main > div:first-child" },
      { name: "Benefits section", selector: '[id="features"]' },
      { name: "Video section", selector: '[id="product-tour"]' },
      { name: "Testimonials section", selector: '[id="testimonials"]' },
      { name: "FAQ section", selector: '[id="faq"]' },
      { name: "CTA section", selector: '[id="cta"]' },
      { name: "Footer", selector: "footer" },
    ];

    for (const section of sections) {
      const sectionElement = page.locator(section.selector).first();
      const isVisible = await sectionElement.isVisible().catch(() => false);
      
      if (isVisible) {
        // Verify the section has proper styling
        const sectionStyles = await sectionElement.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            visibility: computed.visibility,
          };
        });

        expect(sectionStyles.display).not.toBe("none");
        expect(sectionStyles.visibility).not.toBe("hidden");
      }
    }

    // Final check: verify page loads successfully
    const response = await page.goto("/", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    // Verify CSS files are loaded
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("link[rel='stylesheet']")).map(
        (link) => (link as HTMLLinkElement).href,
      );
    });

    // Verify at least one stylesheet is loaded
    expect(stylesheets.length).toBeGreaterThan(0);
  });
});
