"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Eye } from "lucide-react";

const statusColors = {
  pending: "secondary",
  confirmed: "default",
  preparing: "default",
  ready: "default",
  delivered: "default",
  cancelled: "destructive",
} as const;

type OrderStatus = keyof typeof statusColors;

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") as OrderStatus | null;
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">(
    statusParam || "all"
  );

  const orders = useQuery(api.orders.getAllOrders, {
    status: selectedStatus === "all" ? undefined : selectedStatus,
  });

  const statusCounts = {
    all: orders?.length || 0,
    pending: orders?.filter((o) => o.status === "pending").length || 0,
    confirmed: orders?.filter((o) => o.status === "confirmed").length || 0,
    preparing: orders?.filter((o) => o.status === "preparing").length || 0,
    ready: orders?.filter((o) => o.status === "ready").length || 0,
    delivered: orders?.filter((o) => o.status === "delivered").length || 0,
    cancelled: orders?.filter((o) => o.status === "cancelled").length || 0,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Orders Management</h1>

      <Tabs
        value={selectedStatus}
        onValueChange={(value) => setSelectedStatus(value as OrderStatus | "all")}
      >
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({statusCounts.confirmed})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            Preparing ({statusCounts.preparing})
          </TabsTrigger>
          <TabsTrigger value="ready">
            Ready ({statusCounts.ready})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Delivered ({statusCounts.delivered})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({statusCounts.cancelled})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="space-y-4">
          {orders ? (
            orders.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.customerEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{order.itemCount}</TableCell>
                        <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[order.status]}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/d/orders/${order._id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No orders found with the selected status.
                </p>
              </div>
            )
          ) : (
            <Skeleton className="h-96" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}