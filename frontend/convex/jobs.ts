import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    batch: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all hiring companies as "jobs"
    let companies = await ctx.db
      .query("companies")
      .withIndex("by_hiring", (q) => q.eq("isHiring", true))
      .collect();

    if (args.batch) {
      companies = companies.filter((c) => c.batch === args.batch);
    }

    if (args.search) {
      const s = args.search.toLowerCase();
      companies = companies.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.oneLiner?.toLowerCase().includes(s)
      );
    }

    const total = companies.length;
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const page = companies.slice(offset, offset + limit);

    return {
      total,
      jobs: page.map((c) => ({
        _id: c._id,
        title: c.oneLiner || `${c.name} - Open Position`,
        companyName: c.name,
        companySlug: c.slug,
        batch: c.batch,
        logoUrl: c.logoUrl,
        website: c.website,
        ycUrl: c.ycUrl,
        isHiring: c.isHiring,
        teamSize: c.teamSize,
      })),
    };
  },
});
