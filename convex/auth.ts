import { mutation } from "./_generated/server";
import { v } from "convex/values";

// This mutation ensures a user exists in our database when they sign in
export const ensureUser = mutation({
  args: {},
  returns: v.union(
    v.object({
      userId: v.id("users"),
      isNew: v.boolean(),
      isAdmin: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      return {
        userId: existingUser._id,
        isNew: false,
        isAdmin: existingUser.isAdmin,
      };
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email || "",
      name: identity.name || identity.givenName || identity.nickname || "User",
      isAdmin: false,
      createdAt: Date.now(),
    });

    return {
      userId,
      isNew: true,
      isAdmin: false,
    };
  },
});

// Manual sync for existing Clerk users
export const syncClerkUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    makeAdmin: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    userId: v.optional(v.id("users")),
  }),
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user if needed
      if (args.makeAdmin && !existingUser.isAdmin) {
        await ctx.db.patch(existingUser._id, { isAdmin: true });
        return {
          success: true,
          message: `User ${existingUser.name} already exists and was made an admin`,
          userId: existingUser._id,
        };
      }
      return {
        success: true,
        message: `User ${existingUser.name} already exists`,
        userId: existingUser._id,
      };
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      isAdmin: args.makeAdmin || false,
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: `User ${args.name} created successfully${args.makeAdmin ? ' as admin' : ''}`,
      userId,
    };
  },
});