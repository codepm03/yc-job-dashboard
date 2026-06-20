import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  companies: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    longDescription: v.optional(v.string()),
    url: v.optional(v.string()),
    batch: v.optional(v.string()),
    status: v.optional(v.string()),
    industry: v.optional(v.string()),
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
    .index("by_slug", ["slug"])
    .index("by_batch", ["batch"])
    .index("by_hiring", ["isHiring"])
    .index("by_top", ["topCompany"]),

  jobs: defineTable({
    companyId: v.optional(v.id("companies")),
    externalId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    remote: v.optional(v.boolean()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    department: v.optional(v.string()),
    source: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    tier: v.optional(v.string()),
    postedAt: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_tier", ["tier"])
    .index("by_source", ["source"]),

  outreachNotes: defineTable({
    companyId: v.optional(v.id("companies")),
    founderName: v.optional(v.string()),
    note: v.string(),
    status: v.optional(v.string()),
    sentAt: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["status"]),
});
