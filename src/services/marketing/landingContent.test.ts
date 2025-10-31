import { DEFAULT_LOCALE } from "@/src/lib/locale/constants";

import { getLandingContent } from "./landingContent";

describe("getLandingContent", () => {
  it("returns default locale content when locale is missing", () => {
    const content = getLandingContent(null);

    expect(content.meta.title).toContain("IslandiaAI");
    expect(content.nav.links[0].label).toBe("Features");
  });

  it("normalizes unsupported locales to the default", () => {
    const content = getLandingContent("fr");

    expect(content.meta.description).toContain("AI-assisted workflows");
  });

  it("returns Spanish content when locale is es", () => {
    const content = getLandingContent("es");

    expect(content.meta.title).toContain("Flujos financieros inteligentes");
    expect(content.nav.links[0].label).toBe("Funciones");
  });

  it("aligns with DEFAULT_LOCALE constant", () => {
    const content = getLandingContent(DEFAULT_LOCALE);

    expect(content.nav.links[0].label).toBe("Features");
  });
});
