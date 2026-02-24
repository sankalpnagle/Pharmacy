"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/slices/cartSlice";
import toast from "react-hot-toast";   // ✅ ADD

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useDispatch();

  const isOutOfStock = product.availability !== "IN_STOCK";

  const selectedQuantity = 1;
  const totalWeight = null;

  const handleCart = () => {
    dispatch(
      addToCart({
        ...product,
        quantity: selectedQuantity,
        totalWeight: totalWeight ? totalWeight : product?.weight,
      })
    );

    toast.success("Product added to cart 🛒");   // ✅ TOAST

    // ❌ REMOVE THIS
    // router.push("/cart");
  };

  return (
    <Card className="group rounded-2xl overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">

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

      <CardContent className="px-4 py-1 space-y-2">
        <p className="text-xs text-muted-foreground">
          {product.category.parent?.name} / {product.category.name}
        </p>

        <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]">
          {product.name}
        </h3>

        <p className="text-xs text-muted-foreground">
          {product.weight} mg
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold text-primary">
            ₹{product.price}
          </span>

          <Button
            size="sm"
            disabled={isOutOfStock}
            className="rounded-lg text-white"
            onClick={handleCart}
          >
            {isOutOfStock ? "Out" : "Add"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}