import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const markUserAsAdmin = mutation({
  args: {
    clerkId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { isAdmin: true });
  },
});

export const isUserAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user?.isAdmin ?? false;
  },
});

export const getAdminStats = query({
  args: {},
  returns: v.object({
    totalOrders: v.number(),
    pendingOrders: v.number(),
    todayOrders: v.number(),
    totalRevenue: v.number(),
    todayRevenue: v.number(),
    totalCustomers: v.number(),
    totalMenuItems: v.number(),
    availableItems: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user?.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayMs = startOfDay.getTime();

    const allOrders = await ctx.db.query("orders").collect();
    const todaysOrders = allOrders.filter((order) => order.createdAt >= startOfDayMs);
    const pendingOrders = allOrders.filter((order) => order.status === "pending");

    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const todayRevenue = todaysOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const totalCustomers = await ctx.db.query("users").collect();
    const menuItems = await ctx.db.query("menuItems").collect();
    const availableItems = menuItems.filter((item) => item.isAvailable);

    return {
      totalOrders: allOrders.length,
      pendingOrders: pendingOrders.length,
      todayOrders: todaysOrders.length,
      totalRevenue,
      todayRevenue,
      totalCustomers: totalCustomers.length,
      totalMenuItems: menuItems.length,
      availableItems: availableItems.length,
    };
  },
});

export const getAllCustomers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      clerkId: v.string(),
      email: v.string(),
      name: v.string(),
      phone: v.optional(v.string()),
      isAdmin: v.boolean(),
      createdAt: v.number(),
      orderCount: v.number(),
      totalSpent: v.number(),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!admin?.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const users = await ctx.db.query("users").collect();
    const orders = await ctx.db.query("orders").collect();

    const customersWithStats = users.map((user) => {
      const userOrders = orders.filter((order) => order.userId === user._id);
      const totalSpent = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      return {
        _id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        orderCount: userOrders.length,
        totalSpent,
      };
    });

    return customersWithStats;
  },
});