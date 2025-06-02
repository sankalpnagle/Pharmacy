"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface CategoryCardProps {
  data: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  id: number;
}

const CategoryCard = ({ data, id }: CategoryCardProps) => {
  const router = useRouter();

  console.log(data, "dat");

  return (
    <div
      onClick={() => router.push(`/category/products?search=${data?.id}`)}
      className="group cursor-pointer"
    >
      <Card
        className="w-[10rem] h-44 hover:shadow-md transition-all duration-300 
                  border-[1.5px] border-primary/20 bg-[#10847E1A] shadow-none
                  hover:border-primary/50 hover:bg-[#10847E26]"
      >
        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
          <div className="relative w-24 h-24 flex items-center justify-center mb-3">
            <div className="absolute inset-0 bg-white/50 rounded-full"></div>
            {data.imageUrl ? (
              <Image
                src={data.imageUrl}
                alt={data.name}
                width={96}
                height={96}
                className="object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
                unoptimized
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full">
                <span className="text-2xl text-gray-400">
                  {data.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-center w-fit mx-auto mt-2 text-sm font-medium text-gray-700 group-hover:text-primary transition-colors duration-300">
        {data?.name}
      </p>
    </div>
  );
};

export default CategoryCard;
