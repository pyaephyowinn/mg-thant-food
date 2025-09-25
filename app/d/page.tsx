"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag,
  DollarSign,
  Users,
  Utensils,
  TrendingUp,
  Clock,
  CheckCircle,
  Package,
} from "lucide-react";

export default function AdminDashboard() {
  const stats = useQuery(api.admin.getAdminStats);

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      description: "All time orders",
      color: "text-blue-600",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toString(),
      icon: Clock,
      description: "Awaiting confirmation",
      color: "text-yellow-600",
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders.toString(),
      icon: CheckCircle,
      description: "Orders placed today",
      color: "text-green-600",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "All time revenue",
      color: "text-purple-600",
    },
    {
      title: "Today's Revenue",
      value: `$${stats.todayRevenue.toFixed(2)}`,
      icon: TrendingUp,
      description: "Revenue today",
      color: "text-indigo-600",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      icon: Users,
      description: "Registered users",
      color: "text-pink-600",
    },
    {
      title: "Menu Items",
      value: stats.totalMenuItems.toString(),
      icon: Utensils,
      description: "Total menu items",
      color: "text-orange-600",
    },
    {
      title: "Available Items",
      value: stats.availableItems.toString(),
      icon: Package,
      description: "Currently available",
      color: "text-cyan-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/d/orders?status=pending"
              className="block p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">View Pending Orders</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.pendingOrders} orders awaiting confirmation
                  </p>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </a>

            <a
              href="/d/menu/new"
              className="block p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Add New Menu Item</p>
                  <p className="text-sm text-muted-foreground">
                    Add new dishes to your menu
                  </p>
                </div>
                <Utensils className="h-5 w-5 text-muted-foreground" />
              </div>
            </a>

            <a
              href="/d/customers"
              className="block p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">View Customers</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalCustomers} registered customers
                  </p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Average Order Value
              </p>
              <p className="text-2xl font-bold">
                $
                {stats.totalOrders > 0
                  ? (stats.totalRevenue / stats.totalOrders).toFixed(2)
                  : "0.00"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Menu Availability
              </p>
              <p className="text-2xl font-bold">
                {stats.totalMenuItems > 0
                  ? Math.round(
                      (stats.availableItems / stats.totalMenuItems) * 100
                    )
                  : 0}
                %
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Orders Per Customer
              </p>
              <p className="text-2xl font-bold">
                {stats.totalCustomers > 0
                  ? (stats.totalOrders / stats.totalCustomers).toFixed(1)
                  : "0"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}