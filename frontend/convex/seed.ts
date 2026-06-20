import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const seedFromYC = action({
  args: {},
  handler: async (ctx) => {
    // Fetch all YC companies from the free API
    const resp = await fetch(
      "https://yc-oss.github.io/api/companies/all.json"
    );
    const raw = await resp.json();

    // Fetch hiring companies
    let hiringSlugs: Record<string, boolean> = {};
    try {
      const hireResp = await fetch(
        "https://yc-oss.github.io/api/companies/hiring.json"
      );
      const hiring = await hireResp.json();
      for (const c of hiring) {
        if (c.slug) hiringSlugs[c.slug] = true;
      }
    } catch (e) {
      console.error("Failed to fetch hiring data:", e);
    }

    // Transform data
    const companies = raw.map((c: any) => ({
      slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, "-") || "",
      name: c.name || "",
      description: c.one_liner || "",
      longDescription: c.long_description || "",
      url: c.url || "",
      batch: c.batch || "",
      status: c.status || "",
      industries: c.industries || [],
      teamSize: c.team_size || 0,
      website: c.website || "",
      logoUrl: c.logo_url || "",
      topCompany: c.top_company || false,
      isHiring: hiringSlugs[c.slug] || c.isHiring || false,
      regions: c.regions || [],
      tags: c.tags || [],
      oneLiner: c.one_liner || "",
      ycUrl: c.url || "",
      founders: (c.founders || []).map((f: any) => ({
        fullName: f.full_name || f.name || "",
        title: f.title || "",
        linkedinUrl: f.linkedin_url || "",
        twitterUrl: f.twitter_url || "",
      })),
    }));

    // Seed in batches of 100
    const batchSize = 100;
    let totalInserted = 0;
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      const result = await ctx.runMutation(api.companies.seedCompanies, {
        companies: batch,
      });
      totalInserted += result.inserted;
      console.log(
        `Seeded batch ${Math.floor(i / batchSize) + 1}: ${result.inserted} inserted`
      );
    }

    return {
      total: companies.length,
      inserted: totalInserted,
    };
  },
});
