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

const SellingCard = ({ data, id }: any) => {
  const router = useRouter();
  return (
    <div onClick={() => router.push(`/category/products/${data?.id}`)}>
      <Card className="px-2 cursor-pointer pt-4 pb-1.5 scale-90 h-60 m-0  border-primary border-[1.4px]">
        <div className="">
          <div className=" w-fit mx-auto h-32 overflow-hidden">
            <Image
              src={data.imageUrl || img}
              alt={data.name}
              width={130}
              height={130}
              className="object-cover bg-cover p-0  h-auto"
            />
          </div>
          <p className="text-sm  w-full overflow-hidden ml-3 truncate my-2 font-medium ">
            {data.name}
          </p>
          <p className=" text-primary my-1 ml-3 mt-3 text-[20px]">
            <span className=" mr-0.5">$</span>
            {data.price}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SellingCard;
