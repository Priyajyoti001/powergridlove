import { describe, expect, it } from "vitest";
import { reports } from "./ev-data";

describe("verified report destinations", () => {
  it("links guidelines to the BEE guideline record, not a missing generic page", () => {
    expect(reports.find((r) => r.tag === "Policy" && r.year === 2024)?.url).toBe("https://neca.beeindia.gov.in/show_content.php?lang=1&level=1&lid=35&ls_id=91");
  });
  it("uses the current public VAHAN dashboard without inventing a publication year", () => {
    const dataset = reports.find((r) => r.tag === "Data");
    expect(dataset?.url).toBe("https://analytics.parivahan.gov.in/analytics/publicdashboard/vahan?lang=en");
    expect(dataset?.year).toBeNull();
  });
  it("uses the publisher's direct IEA PDF instead of the blocked report page", () => {
    expect(reports.find((r) => r.tag === "Global")?.url).toBe("https://iea.blob.core.windows.net/assets/7ea38b60-3033-42a6-9589-71134f4229f4/GlobalEVOutlook2025.pdf");
  });
});