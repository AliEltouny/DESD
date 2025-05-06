import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Other tables here...

  notifications: defineTable({
    isRead: v.boolean(),
    test: v.string(),
  }),
});