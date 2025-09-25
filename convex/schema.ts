import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    isAdmin: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
  })
    .index("by_active", ["isActive"])
    .index("by_order", ["order"]),

  menuItems: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    image: v.optional(v.string()),
    isAvailable: v.boolean(),
    isFeatured: v.boolean(),
    preparationTime: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_category", ["categoryId"])
    .index("by_available", ["isAvailable"])
    .index("by_featured", ["isFeatured"])
    .index("by_category_and_available", ["categoryId", "isAvailable"]),

  orders: defineTable({
    userId: v.id("users"),
    orderNumber: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    totalAmount: v.number(),
    deliveryAddress: v.string(),
    phone: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_order_number", ["orderNumber"])
    .index("by_created", ["createdAt"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    menuItemId: v.id("menuItems"),
    quantity: v.number(),
    price: v.number(),
    itemName: v.string(),
    notes: v.optional(v.string()),
  })
    .index("by_order", ["orderId"])
    .index("by_menu_item", ["menuItemId"]),
});