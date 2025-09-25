"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserHeader } from "@/components/layout/user-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ShoppingBag, Clock, Truck } from "lucide-react";

export default function HomePage() {
  const categories = useQuery(api.menu.getCategories, { activeOnly: true });
  const featuredItems = useQuery(api.menu.getMenuItems, {
    featuredOnly: true,
    availableOnly: true
  });

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to MG Thant Food</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Delicious food delivered to your doorstep
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <Card>
              <CardContent className="pt-6">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Easy Ordering</h3>
                <p className="text-sm text-muted-foreground">
                  Browse our menu and order with just a few clicks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Fast Preparation</h3>
                <p className="text-sm text-muted-foreground">
                  Fresh food prepared quickly by our expert chefs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Truck className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Quick Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Get your food delivered hot and fresh
                </p>
              </CardContent>
            </Card>
          </div>

          <Link href="/menu">
            <Button size="lg" className="text-lg px-8">
              Browse Menu
            </Button>
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories ? (
              categories.map((category) => (
                <Link key={category._id} href={`/menu?category=${category._id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              ))
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))
            )}
          </div>
        </section>

        {featuredItems && featuredItems.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Featured Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.slice(0, 6).map((item) => (
                <Card key={item._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.category.name}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {item.description}
                    </p>
                    <Link href={`/menu/${item._id}`}>
                      <Button className="w-full">View Details</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}