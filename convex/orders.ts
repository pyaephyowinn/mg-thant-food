import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const OrderStatus = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("preparing"),
  v.literal("ready"),
  v.literal("delivered"),
  v.literal("cancelled")
);

export const createOrder = mutation({
  args: {
    items: v.array(
      v.object({
        menuItemId: v.id("menuItems"),
        quantity: v.number(),
        notes: v.optional(v.string()),
      })
    ),
    deliveryAddress: v.string(),
    phone: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    orderId: v.id("orders"),
    orderNumber: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email || "",
        name: identity.name || "Guest",
        phone: args.phone,
        address: args.deliveryAddress,
        isAdmin: false,
        createdAt: Date.now(),
      });

      const userIdForOrder = userId;
      return await createOrderWithUser(ctx, args, userIdForOrder);
    }

    if (!user.phone || !user.address) {
      await ctx.db.patch(user._id, {
        phone: args.phone,
        address: args.deliveryAddress,
      });
    }

    return await createOrderWithUser(ctx, args, user._id);
  },
});

async function createOrderWithUser(ctx: any, args: any, userId: any) {
  let totalAmount = 0;
  const orderItems = [];

  for (const item of args.items) {
    const menuItem = await ctx.db.get(item.menuItemId);
    if (!menuItem) {
      throw new Error(`Menu item not found: ${item.menuItemId}`);
    }
    if (!menuItem.isAvailable) {
      throw new Error(`Menu item not available: ${menuItem.name}`);
    }

    const itemTotal = menuItem.price * item.quantity;
    totalAmount += itemTotal;

    orderItems.push({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      price: menuItem.price,
      itemName: menuItem.name,
      notes: item.notes,
    });
  }

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

  const orderId = await ctx.db.insert("orders", {
    userId,
    orderNumber,
    status: "pending",
    totalAmount,
    deliveryAddress: args.deliveryAddress,
    phone: args.phone,
    notes: args.notes,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  for (const orderItem of orderItems) {
    await ctx.db.insert("orderItems", {
      orderId,
      ...orderItem,
    });
  }

  return {
    orderId,
    orderNumber,
  };
}

export const getUserOrders = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("orders"),
      orderNumber: v.string(),
      status: OrderStatus,
      totalAmount: v.number(),
      deliveryAddress: v.string(),
      phone: v.string(),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      itemCount: v.number(),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const ordersWithItemCount = await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        return {
          ...order,
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        };
      })
    );

    return ordersWithItemCount;
  },
});

export const getOrderDetails = query({
  args: {
    orderId: v.id("orders"),
  },
  returns: v.union(
    v.object({
      _id: v.id("orders"),
      orderNumber: v.string(),
      status: OrderStatus,
      totalAmount: v.number(),
      deliveryAddress: v.string(),
      phone: v.string(),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      items: v.array(
        v.object({
          _id: v.id("orderItems"),
          menuItemId: v.id("menuItems"),
          quantity: v.number(),
          price: v.number(),
          itemName: v.string(),
          notes: v.optional(v.string()),
          menuItem: v.union(
            v.object({
              name: v.string(),
              image: v.optional(v.string()),
            }),
            v.null()
          ),
        })
      ),
      user: v.object({
        name: v.string(),
        email: v.string(),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      return null;
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) {
      throw new Error("User not found");
    }

    if (order.userId !== currentUser._id && !currentUser.isAdmin) {
      throw new Error("Unauthorized: You can only view your own orders");
    }

    const orderUser = await ctx.db.get(order.userId);
    if (!orderUser) {
      throw new Error("Order user not found");
    }

    const orderItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .collect();

    const itemsWithMenuDetails = await Promise.all(
      orderItems.map(async (item) => {
        const menuItem = await ctx.db.get(item.menuItemId);
        return {
          ...item,
          menuItem: menuItem ? { name: menuItem.name, image: menuItem.image } : null,
        };
      })
    );

    return {
      ...order,
      items: itemsWithMenuDetails,
      user: {
        name: orderUser.name,
        email: orderUser.email,
      },
    };
  },
});

export const getAllOrders = query({
  args: {
    status: v.optional(OrderStatus),
  },
  returns: v.array(
    v.object({
      _id: v.id("orders"),
      orderNumber: v.string(),
      status: OrderStatus,
      totalAmount: v.number(),
      deliveryAddress: v.string(),
      phone: v.string(),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      itemCount: v.number(),
      customerName: v.string(),
      customerEmail: v.string(),
    })
  ),
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

    const orders = args.status
      ? await ctx.db
          .query("orders")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect()
      : await ctx.db
          .query("orders")
          .order("desc")
          .collect();

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const [customer, orderItems] = await Promise.all([
          ctx.db.get(order.userId),
          ctx.db
            .query("orderItems")
            .withIndex("by_order", (q) => q.eq("orderId", order._id))
            .collect(),
        ]);

        return {
          ...order,
          itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
          customerName: customer?.name || "Unknown",
          customerEmail: customer?.email || "Unknown",
        };
      })
    );

    return ordersWithDetails;
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: OrderStatus,
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

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const cancelOrder = mutation({
  args: {
    orderId: v.id("orders"),
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

    if (!user) {
      throw new Error("User not found");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.userId !== user._id && !user.isAdmin) {
      throw new Error("Unauthorized: You can only cancel your own orders");
    }

    if (order.status !== "pending" && order.status !== "confirmed" && !user.isAdmin) {
      throw new Error("Order cannot be cancelled at this stage");
    }

    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
  },
});