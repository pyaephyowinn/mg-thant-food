"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const handleClearCache = () => {
    localStorage.clear();
    toast.success("Cache cleared successfully");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>
            Manage your restaurant's basic information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Restaurant Name</p>
              <p className="text-sm text-muted-foreground">MG Thant Food</p>
            </div>
            <div>
              <p className="font-medium">Business Hours</p>
              <p className="text-sm text-muted-foreground">
                Monday - Sunday: 9:00 AM - 10:00 PM
              </p>
            </div>
            <div>
              <p className="font-medium">Delivery Areas</p>
              <p className="text-sm text-muted-foreground">
                All areas within 10km radius
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Settings</CardTitle>
          <CardDescription>
            Configure order-related settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Minimum Order Amount</p>
              <p className="text-sm text-muted-foreground">No minimum</p>
            </div>
            <div>
              <p className="font-medium">Delivery Fee</p>
              <p className="text-sm text-muted-foreground">Free delivery</p>
            </div>
            <div>
              <p className="font-medium">Payment Method</p>
              <p className="text-sm text-muted-foreground">Cash on delivery only</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System</CardTitle>
          <CardDescription>
            System maintenance and utilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium mb-2">Clear Cache</p>
            <p className="text-sm text-muted-foreground mb-4">
              Clear browser cache and local storage data
            </p>
            <Button variant="outline" onClick={handleClearCache}>
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Tools</CardTitle>
          <CardDescription>
            Tools for managing admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Mark User as Admin</p>
            <p className="text-sm text-muted-foreground mb-4">
              To grant admin access to a user, use the Convex dashboard or run:
            </p>
            <code className="block p-2 bg-background rounded text-xs">
              npx convex run admin:markUserAsAdmin --clerkId "user_xxxxx"
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}