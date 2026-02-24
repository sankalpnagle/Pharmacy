"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface CategoryCardProps {
  data: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

const CategoryCard = ({ data }: CategoryCardProps) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/category/products?search=${data?.id}`)}
      className="group cursor-pointer w-56"
    >
      {/* CARD */}
      <Card
        className="
        relative w-56 h-56 overflow-hidden
        rounded-3xl border-none
        shadow-[0_4px_20px_rgba(0,0,0,0.05)]
        hover:shadow-[0_10px_35px_rgba(0,0,0,0.10)]
        transition-all duration-300 hover:-translate-y-1
      "
      >
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={data.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-bold text-primary">
              {data.name.charAt(0)}
            </span>
          </div>
        )}

        {/* optional overlay for better readability */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300" />
      </Card>

      {/* TITLE OUTSIDE */}
      <p className="mt-3 text-center text-base font-semibold text-gray-700 group-hover:text-primary transition-colors duration-300">
        {data.name}
      </p>
    </div>
  );
};

export default CategoryCard;