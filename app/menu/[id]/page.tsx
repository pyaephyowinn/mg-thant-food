"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserHeader } from "@/components/layout/user-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Minus } from "lucide-react";

export default function MenuItemPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as Id<"menuItems">;

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const item = useQuery(api.menu.getMenuItem, { id: itemId });
  const { addItem } = useCart();

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!item) return;

    addItem({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      quantity,
      notes: notes.trim() || undefined,
      image: item.image,
    });

    toast.success(`${quantity} ${item.name} added to cart`);
    router.push("/menu");
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  const totalPrice = item.price * quantity;

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
          Back to Menu
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{item.name}</CardTitle>
              <p className="text-muted-foreground">{item.category.name}</p>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-4">{item.description}</p>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="text-2xl font-bold text-primary">
                  ${item.price.toFixed(2)}
                </p>
                {item.preparationTime && (
                  <p>Preparation time: {item.preparationTime} minutes</p>
                )}
                <p>
                  Availability:{" "}
                  <span className={item.isAvailable ? "text-green-600" : "text-red-600"}>
                    {item.isAvailable ? "Available" : "Not Available"}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add to Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= 99) {
                        setQuantity(val);
                      }
                    }}
                    className="w-20 text-center"
                    min="1"
                    max="99"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 99}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Special Instructions (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., No onions, extra spicy, etc."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="w-full"
                  size="lg"
                  disabled={!item.isAvailable}
                >
                  {item.isAvailable ? "Add to Cart" : "Item Not Available"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}