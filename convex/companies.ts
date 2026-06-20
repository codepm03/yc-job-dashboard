import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    batch: v.optional(v.string()),
    industry: v.optional(v.string()),
    isHiring: v.optional(v.boolean()),
    topCompany: v.optional(v.boolean()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("companies");

    if (args.batch) {
      q = q.withIndex("by_batch", (q) => q.eq("batch", args.batch));
    } else if (args.isHiring !== undefined) {
      q = q.withIndex("by_hiring", (q) => q.eq("isHiring", args.isHiring));
    } else if (args.topCompany !== undefined) {
      q = q.withIndex("by_top", (q) => q.eq("topCompany", args.topCompany));
    }

    let results = await q.collect();

    // Filter by industry (multi-field filter)
    if (args.industry) {
      results = results.filter((c) =>
        c.industries?.some(
          (i) => i.toLowerCase() === args.industry!.toLowerCase()
        )
      );
    }

    // Text search
    if (args.search) {
      const s = args.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.oneLiner?.toLowerCase().includes(s) ||
          c.description?.toLowerCase().includes(s) ||
          c.longDescription?.toLowerCase().includes(s)
      );
    }

    const total = results.length;
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const page = results.slice(offset, offset + limit);

    return { total, companies: page };
  },
});

export const get = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const company = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    return company;
  },
});

export const batches = query({
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    const batchMap: Record<string, number> = {};
    for (const c of companies) {
      const b = c.batch || "Unknown";
      batchMap[b] = (batchMap[b] || 0) + 1;
    }
    return Object.entries(batchMap)
      .sort((a, b) => b[1] - a[1])
      .map(([batch, count]) => ({ batch, count }));
  },
});

export const industries = query({
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    const indMap: Record<string, number> = {};
    for (const c of companies) {
      for (const ind of c.industries || []) {
        indMap[ind] = (indMap[ind] || 0) + 1;
      }
    }
    return Object.entries(indMap)
      .sort((a, b) => b[1] - a[1])
      .map(([industry, count]) => ({ industry, count }));
  },
});

export const stats = query({
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    const jobs = await ctx.db.query("jobs").collect();

    const batchMap: Record<string, number> = {};
    let hiringCount = 0;

    for (const c of companies) {
      const b = c.batch || "Unknown";
      batchMap[b] = (batchMap[b] || 0) + 1;
      if (c.isHiring) hiringCount++;
    }

    const tierMap: Record<string, number> = {};
    for (const j of jobs) {
      const t = j.tier || "T3";
      tierMap[t] = (tierMap[t] || 0) + 1;
    }

    return {
      totalCompanies: companies.length,
      hiringCompanies: hiringCount,
      totalJobs: jobs.length,
      jobsByTier: tierMap,
      companiesByBatch: Object.entries(batchMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([batch, count]) => ({ batch, count })),
    };
  },
});

export const seedCompanies = mutation({
  args: {
    companies: v.array(
      v.object({
        slug: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        longDescription: v.optional(v.string()),
        url: v.optional(v.string()),
        batch: v.optional(v.string()),
        status: v.optional(v.string()),
        industries: v.optional(v.array(v.string())),
        teamSize: v.optional(v.number()),
        website: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        topCompany: v.optional(v.boolean()),
        isHiring: v.optional(v.boolean()),
        regions: v.optional(v.array(v.string())),
        tags: v.optional(v.array(v.string())),
        oneLiner: v.optional(v.string()),
        ycUrl: v.optional(v.string()),
        founders: v.optional(
          v.array(
            v.object({
              fullName: v.string(),
              title: v.optional(v.string()),
              linkedinUrl: v.optional(v.string()),
              twitterUrl: v.optional(v.string()),
            })
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    for (const c of args.companies) {
      const existing = await ctx.db
        .query("companies")
        .withIndex("by_slug", (q) => q.eq("slug", c.slug))
        .unique();
      if (!existing) {
        await ctx.db.insert("companies", {
          ...c,
          industry: c.industries?.[0],
          isHiring: c.isHiring || false,
          topCompany: c.topCompany || false,
        });
        inserted++;
      }
    }
    return { inserted };
  },
});
