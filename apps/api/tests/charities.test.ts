import { api, unique } from "./helpers";
import { prisma } from "../src/config/prisma";

async function makeCharity(
  overrides: Partial<{
    name: string;
    country: string;
    province: string;
    city: string;
    type: string;
    focus: string;
    policyNote: string;
    address: string;
    website: string;
    registration: string;
    isActive: boolean;
  }> = {}
) {
  const sourceId = unique("CHT");
  return prisma.charity.create({
    data: {
      sourceId,
      name: overrides.name ?? `Charity ${sourceId}`,
      country: overrides.country ?? "Pakistan",
      province: overrides.province ?? "Sindh",
      city: overrides.city ?? "Karachi",
      type: overrides.type ?? "Local NGO",
      focus: overrides.focus ?? null,
      policyNote: overrides.policyNote ?? null,
      address: overrides.address ?? null,
      website: overrides.website ?? null,
      registration: overrides.registration ?? null,
      isActive: overrides.isActive ?? true,
    },
  });
}

describe("Charity directory", () => {
  it("is public and returns only active entries", async () => {
    await makeCharity({ name: "Active Trust" });
    await makeCharity({ name: "Retired Trust", isActive: false });

    const res = await api().get("/api/v1/charities");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Active Trust");
  });

  it("filters by country, province and city", async () => {
    const country = unique("Ctry");
    await makeCharity({ country, province: "Punjab", city: "Lahore", name: "LHR One" });
    await makeCharity({ country, province: "Sindh", city: "Karachi", name: "KHI One" });

    const byCountry = await api().get(`/api/v1/charities?country=${country}`);
    expect(byCountry.body.pagination.total).toBe(2);

    const byProvince = await api().get(`/api/v1/charities?country=${country}&province=punjab`);
    expect(byProvince.body.pagination.total).toBe(1);
    expect(byProvince.body.data[0].city).toBe("Lahore");

    const byCity = await api().get(`/api/v1/charities?country=${country}&province=Sindh&city=karachi`);
    expect(byCity.body.pagination.total).toBe(1);
    expect(byCity.body.data[0].name).toBe("KHI One");
  });

  it("filters by 100% donation policy flag", async () => {
    const province = unique("PolProv");
    await makeCharity({ province, name: "Hundred", policyNote: "100% donation policy; all to beneficiaries" });
    await makeCharity({ province, name: "Partial", policyNote: "Some admin costs deducted" });

    const res = await api().get(`/api/v1/charities?province=${province}&policy=100`);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Hundred");
  });

  it("searches across name, focus, city, province and type", async () => {
    const country = unique("SrcCtry");
    await makeCharity({ country, name: "Zakat House", focus: "Interest-free microfinance", type: "Local NGO" });
    await makeCharity({ country, name: "Other Org" });

    const res = await api().get(`/api/v1/charities?country=${country}&q=microfinance`);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Zakat House");

    const res2 = await api().get(`/api/v1/charities?country=${country}&q=Zakat`);
    expect(res2.body.pagination.total).toBe(1);
  });

  it("returns distinct facets for cascading dropdowns", async () => {
    const country = unique("FacetCtry");
    await makeCharity({ country, province: "Punjab", city: "Lahore" });
    await makeCharity({ country, province: "Sindh", city: "Karachi" });

    const res = await api().get("/api/v1/charities/facets");
    expect(res.status).toBe(200);
    expect(res.body.data.countries).toContain(country);
    expect(res.body.data.provinces).toContain("Punjab");
    expect(res.body.data.cities).toContain("Karachi");
  });

  it("returns a single entry by sourceId and 404s otherwise", async () => {
    const c = await makeCharity({ name: "Single Org", website: "https://example.org" });

    const ok = await api().get(`/api/v1/charities/${c.sourceId}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.name).toBe("Single Org");
    expect(ok.body.data.website).toBe("https://example.org");

    const missing = await api().get("/api/v1/charities/nothing");
    expect(missing.status).toBe(404);

    await prisma.charity.update({ where: { id: c.id }, data: { isActive: false } });
    const inactive = await api().get(`/api/v1/charities/${c.sourceId}`);
    expect(inactive.status).toBe(404);
  });

  it("rejects an invalid policy value with 422", async () => {
    const res = await api().get("/api/v1/charities?policy=50");
    expect(res.status).toBe(422);
  });
});
