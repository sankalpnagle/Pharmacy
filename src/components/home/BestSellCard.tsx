"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import img from "@/../public/images/cart/product.jpg";

interface BestSellCardProps {
  data: {
    id: string;
    name: string;
    price: string | number;
    imageUrl?: string;
  };
  id: number;
}

const BestSellCard = ({ data, id }: BestSellCardProps) => {
  const router = useRouter();

  // Format price to handle both string and number inputs
  const formatPrice = (price: string | number) => {
    if (typeof price === "string") {
      // Remove any non-numeric characters except decimal point
      const numericValue = price.replace(/[^0-9.]/g, "");
      return parseFloat(numericValue).toFixed(2);
    }
    return price.toFixed(2);
  };

  return (
    <Card
      onClick={() => router.push(`/category/products/${data.id}`)}
      className="w-[11rem] hover:cursor-pointer border-[1.5px] border-gray-200 shadow-none 
                hover:shadow-md hover:border-primary/50 transition-all duration-300
                flex flex-col justify-between h-full"
    >
      <CardHeader className="pb-1">
        <CardTitle className="font-medium text-base line-clamp-2 h-[3rem]">
          {data.name}
        </CardTitle>
      </CardHeader>

      <div className="flex items-end justify-between px-4 pb-3">
        <CardFooter className="p-0">
          <p className="text-primary text-lg font-semibold">
            <span className="text-xs mr-0.5">$</span>
            {formatPrice(data.price)}
          </p>
        </CardFooter>

        <div className="relative w-[80px] h-[80px] flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-100 rounded-full"></div>
          <Image
            src={data.imageUrl || img}
            alt={data.name}
            width={80}
            height={80}
            className="object-contain w-[64px] h-[64px] relative z-10"
          />
        </div>
      </div>
    </Card>
  );
};

export default BestSellCard;
