import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to list all users - run this first to find your user
export const listAllUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      clerkId: v.string(),
      email: v.string(),
      name: v.string(),
      isAdmin: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(user => ({
      _id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    }));
  },
});

// Mutation to make a user admin by email
export const makeAdminByEmail = mutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      return {
        success: false,
        message: `User not found with email: ${args.email}`
      };
    }

    if (user.isAdmin) {
      return {
        success: true,
        message: `User ${user.name} is already an admin`
      };
    }

    await ctx.db.patch(user._id, { isAdmin: true });

    return {
      success: true,
      message: `Successfully made ${user.name} (${user.email}) an admin!`
    };
  },
});