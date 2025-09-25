import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCategories = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      name: v.string(),
      description: v.optional(v.string()),
      image: v.optional(v.string()),
      order: v.number(),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const categories = args.activeOnly
      ? await ctx.db
          .query("categories")
          .withIndex("by_active", (q) => q.eq("isActive", true))
          .collect()
      : await ctx.db.query("categories").collect();

    return categories.sort((a, b) => a.order - b.order);
  },
});

export const getMenuItems = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    availableOnly: v.optional(v.boolean()),
    featuredOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("menuItems"),
      name: v.string(),
      description: v.string(),
      price: v.number(),
      categoryId: v.id("categories"),
      image: v.optional(v.string()),
      isAvailable: v.boolean(),
      isFeatured: v.boolean(),
      preparationTime: v.optional(v.number()),
      createdAt: v.number(),
      category: v.object({
        _id: v.id("categories"),
        name: v.string(),
      }),
    })
  ),
  handler: async (ctx, args) => {
    let items;

    if (args.categoryId && args.availableOnly) {
      items = await ctx.db
        .query("menuItems")
        .withIndex("by_category_and_available", (q) =>
          q.eq("categoryId", args.categoryId!).eq("isAvailable", true)
        )
        .collect();
    } else if (args.categoryId) {
      items = await ctx.db
        .query("menuItems")
        .withIndex("by_category", (q) =>
          q.eq("categoryId", args.categoryId!)
        )
        .collect();
    } else if (args.availableOnly) {
      items = await ctx.db
        .query("menuItems")
        .withIndex("by_available", (q) =>
          q.eq("isAvailable", true)
        )
        .collect();
    } else if (args.featuredOnly) {
      items = await ctx.db
        .query("menuItems")
        .withIndex("by_featured", (q) =>
          q.eq("isFeatured", true)
        )
        .collect();
    } else {
      items = await ctx.db.query("menuItems").collect();
    }

    const filteredItems = items.filter((item) => {
      if (args.availableOnly && !args.categoryId && !item.isAvailable) return false;
      if (args.featuredOnly && !item.isFeatured) return false;
      return true;
    });

    const itemsWithCategory = await Promise.all(
      filteredItems.map(async (item) => {
        const category = await ctx.db.get(item.categoryId);
        return {
          ...item,
          category: category ? { _id: category._id, name: category.name } : { _id: item.categoryId, name: "Unknown" },
        };
      })
    );

    return itemsWithCategory;
  },
});

export const getMenuItem = query({
  args: {
    id: v.id("menuItems"),
  },
  returns: v.union(
    v.object({
      _id: v.id("menuItems"),
      name: v.string(),
      description: v.string(),
      price: v.number(),
      categoryId: v.id("categories"),
      image: v.optional(v.string()),
      isAvailable: v.boolean(),
      isFeatured: v.boolean(),
      preparationTime: v.optional(v.number()),
      createdAt: v.number(),
      category: v.object({
        _id: v.id("categories"),
        name: v.string(),
        description: v.optional(v.string()),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return null;

    const category = await ctx.db.get(item.categoryId);
    return {
      ...item,
      category: category
        ? { _id: category._id, name: category.name, description: category.description }
        : { _id: item.categoryId, name: "Unknown", description: undefined },
    };
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
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

    return await ctx.db.insert("categories", args);
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

    const { id, ...updateData } = args;
    await ctx.db.patch(id, updateData);
  },
});

export const deleteCategory = mutation({
  args: {
    id: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .collect();

    if (items.length > 0) {
      throw new Error("Cannot delete category with menu items");
    }

    await ctx.db.delete(args.id);
  },
});

export const createMenuItem = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    image: v.optional(v.string()),
    isAvailable: v.boolean(),
    isFeatured: v.boolean(),
    preparationTime: v.optional(v.number()),
  },
  returns: v.id("menuItems"),
  handler: async (ctx, args) => {
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

    return await ctx.db.insert("menuItems", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateMenuItem = mutation({
  args: {
    id: v.id("menuItems"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    image: v.optional(v.string()),
    isAvailable: v.boolean(),
    isFeatured: v.boolean(),
    preparationTime: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

    const { id, ...updateData } = args;
    await ctx.db.patch(id, updateData);
  },
});

export const deleteMenuItem = mutation({
  args: {
    id: v.id("menuItems"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

    await ctx.db.delete(args.id);
  },
});