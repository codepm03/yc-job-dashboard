import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("outreachNotes");

    if (args.companyId) {
      q = q.withIndex("by_company", (q) =>
        q.eq("companyId", args.companyId)
      );
    } else if (args.status) {
      q = q.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    const notes = await q.order("desc").collect();

    // Enrich with company names
    const enriched = await Promise.all(
      notes.map(async (n) => {
        let companyName = "";
        if (n.companyId) {
          const company = await ctx.db.get(n.companyId);
          companyName = company?.name || "";
        }
        return { ...n, companyName };
      })
    );

    return enriched;
  },
});

export const create = mutation({
  args: {
    companyId: v.optional(v.id("companies")),
    founderName: v.optional(v.string()),
    note: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("outreachNotes", {
      companyId: args.companyId,
      founderName: args.founderName,
      note: args.note,
      status: args.status || "not_sent",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("outreachNotes"),
    note: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, any> = {};
    if (args.note !== undefined) updates.note = args.note;
    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "sent") updates.sentAt = new Date().toISOString();
    }
    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { id: v.id("outreachNotes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});
