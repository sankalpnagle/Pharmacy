"use client";
import SearchInput from "@/components/custom_components/SearchInput";
import CategoryCard from "@/components/home/CategoryCard";
import React, { useEffect, useState } from "react";
import { getAllCategory } from "@/services/categoryService";
import { t } from "@/utils/translate";

const Page = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllCategory = async () => {
    const res = await getAllCategory();
    setData(res.data?.categories || []);
  };

  useEffect(() => {
    fetchAllCategory();
  }, []);

  const filteredData = data
    .map((category) => {
      const nameMatches = category.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const filteredChildren = category.children?.filter((child) =>
        child.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (nameMatches || filteredChildren.length > 0) {
        return {
          ...category,
          children: filteredChildren,
        };
      }

      return null;
    })
    .filter(Boolean);

  return (
    <div>
      <div className="sm:w-4/6 w-full mx-auto">
        <SearchInput
          className="w-full"
          placeholder={t("search_category")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex mt-10 items-end">
        <h1 className="text-primary font-semibold text-xl">
          {t("shop_by_categories")}
        </h1>
      </div>

      <div className="mt-5 mx-auto grid w-[95%] gap-y-4 gap-x-2 sm:gap-x-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filteredData.map((item, index) => (
          <CategoryCard key={index} data={item} id={index} />
        ))}
      </div>
    </div>
  );
};

export default Page;
