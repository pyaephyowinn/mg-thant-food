// Run this script with: npx convex run scripts/make-admin.ts --clerkId "YOUR_CLERK_ID"

import { internalMutation } from "../convex/_generated/server";
import { v } from "convex/values";

export default internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error(`User not found with Clerk ID: ${args.clerkId}`);
    }

    await ctx.db.patch(user._id, { isAdmin: true });

    console.log(`✅ Successfully made user ${user.name} (${user.email}) an admin!`);
    return { success: true, user: user.name };
  },
});