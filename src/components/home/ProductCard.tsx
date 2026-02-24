"use client";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.availability !== "IN_STOCK";

  return (
    <Card className="group rounded-2xl overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">

      {/* IMAGE SECTION */}
      <div className="relative w-full h-44 bg-white">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition duration-300"
        />

        {product.requiresPrescription && (
          <span className="absolute top-2 left-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-md font-medium">
            Rx
          </span>
        )}
      </div>

      {/* CONTENT SECTION */}
      <CardContent className="p-4 space-y-2">

        {/* CATEGORY */}
        <p className="text-xs text-muted-foreground">
          {product.category.parent?.name} / {product.category.name}
        </p>

        {/* NAME */}
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]">
          {product.name}
        </h3>

        {/* WEIGHT */}
        <p className="text-xs text-muted-foreground">
          {product.weight} mg
        </p>

        {/* PRICE + BUTTON */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-primary">
            ₹{product.price}
          </span>

          <Button
            size="sm"
            disabled={isOutOfStock}
            className="rounded-lg"
          >
            {isOutOfStock ? "Out" : "Add"}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}