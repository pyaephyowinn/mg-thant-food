"use client";

import { useParams, useRouter } from "next/navigation";
import { UserHeader } from "@/components/layout/user-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Phone, Clock, CheckCircle, XCircle } from "lucide-react";

const statusColors = {
  pending: "secondary",
  confirmed: "default",
  preparing: "default",
  ready: "default",
  delivered: "default",
  cancelled: "destructive",
} as const;

const statusSteps = [
  { status: "pending", label: "Order Placed", icon: Clock },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle },
  { status: "preparing", label: "Preparing", icon: Clock },
  { status: "ready", label: "Ready", icon: CheckCircle },
  { status: "delivered", label: "Delivered", icon: CheckCircle },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as Id<"orders">;

  const order = useQuery(api.orders.getOrderDetails, { orderId });
  const cancelOrder = useMutation(api.orders.cancelOrder);

  const handleCancelOrder = async () => {
    if (!order || !window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      await cancelOrder({ orderId });
      toast.success("Order cancelled successfully");
    } catch (error) {
      toast.error("Failed to cancel order");
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  const canCancel = order.status === "pending" || order.status === "confirmed";
  const currentStepIndex = statusSteps.findIndex((s) => s.status === order.status);

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    Order {order.orderNumber}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={statusColors[order.status]}
                    className="text-lg px-3 py-1"
                  >
                    {order.status}
                  </Badge>
                  {canCancel && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancelOrder}
                      className="mt-2"
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {order.status !== "cancelled" && (
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index <= currentStepIndex;
                    const isCurrent = statusSteps[index].status === order.status;

                    return (
                      <div
                        key={step.status}
                        className="flex flex-col items-center"
                      >
                        <div
                          className={`rounded-full p-2 ${
                            isActive
                              ? isCurrent
                                ? "bg-primary text-primary-foreground"
                                : "bg-green-500 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isActive && !isCurrent ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <Icon className="h-6 w-6" />
                          )}
                        </div>
                        <span
                          className={`text-xs mt-2 ${
                            isActive ? "font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">
                    {order.deliveryAddress}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">{order.phone}</p>
                </div>
              </div>
              {order.notes && (
                <div>
                  <p className="font-medium">Order Notes</p>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item._id}>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Payment Method</p>
                <p className="text-sm text-muted-foreground">Cash on Delivery</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}