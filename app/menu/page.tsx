"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserHeader } from "@/components/layout/user-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function MenuPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | "all">(
    categoryParam as Id<"categories"> | "all" || "all"
  );

  const categories = useQuery(api.menu.getCategories, { activeOnly: true });
  const menuItems = useQuery(api.menu.getMenuItems, {
    categoryId: selectedCategory === "all" ? undefined : selectedCategory as Id<"categories">,
    availableOnly: true,
  });

  const { addItem } = useCart();

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam as Id<"categories">);
    }
  }, [categoryParam]);

  const handleAddToCart = (item: any) => {
    addItem({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Our Menu</h1>

        <Tabs
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value as Id<"categories"> | "all")}
          className="space-y-6"
        >
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="all">All Items</TabsTrigger>
            {categories?.map((category) => (
              <TabsTrigger key={category._id} value={category._id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4">
            {menuItems ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
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
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {item.description}
                      </p>
                      {item.preparationTime && (
                        <p className="text-xs text-muted-foreground mb-4">
                          Prep time: {item.preparationTime} mins
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAddToCart(item)}
                          className="flex-1"
                        >
                          Add to Cart
                        </Button>
                        <Link href={`/menu/${item._id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            )}

            {menuItems && menuItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No items available in this category.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}