"use client";

import SearchInput from "@/components/custom_components/SearchInput";
import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import PlusIcon from "@/../public/icons/plusCircle.svg";
import MinusIcon from "@/../public/icons/minusCircle.svg";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getAllProduct } from "@/services/productService";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllCategory } from "@/services/categoryService";
import SellingCard from "@/components/home/SellingCard";
import { useLoading } from "@/context/LoadingContext";
import CategorySideBar from "@/components/header/CategorySideBar";
import { t } from "@/utils/translate";

const FormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: t("you_have_to_select_at_least_one_item"),
  }),
});

interface Category {
  id: string;
  name: string;
  children?: Category[];
  parentId?: string;
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    parentId?: string;
    parent?: {
      id: string;
      name: string;
    };
  };
}

const Products = () => {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  const [categoryOption, setCategoryOption] = useState<Category[]>([]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [data, setData] = useState<Product[]>([]);
  const router = useRouter();
  const { showLoader, hideLoader } = useLoading();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: [],
    },
  });

  const fetchAllProduct = async () => {
    try {
      showLoader();
      const res = await getAllProduct();
      setData(res.data?.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setData([]);
    } finally {
      hideLoader();
    }
  };

  const fetchAllCategories = async () => {
    try {
      showLoader();
      const res = await getAllCategory();
      setCategoryOption(res?.data?.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategoryOption([]);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    Promise.all([fetchAllProduct(), fetchAllCategories()]);
  }, []);

  const selectedItems = form.watch("items") || [];

  const handleToggle = (categoryId: string) => {
    setOpenCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const isAllChildrenChecked = (field: any, children?: Category[]) => {
    if (!children || children.length === 0) return false;
    return children.every((child) => field.value?.includes(child.id));
  };

  const toggleParentCheckbox = (
    field: any,
    parentId: string,
    children?: Category[]
  ) => {
    if (!children) return;

    const allChildIds = children.map((child) => child.id);
    const isSelected = isAllChildrenChecked(field, children);

    if (isSelected) {
      field.onChange(
        field.value?.filter((id: string) => !allChildIds.includes(id))
      );
    } else {
      const updated = [
        ...(field.value || []),
        ...allChildIds.filter((id) => !field.value?.includes(id)),
      ];
      field.onChange(updated);
    }
  };

  useEffect(() => {
    if (!selectedItems || selectedItems.length === 0) {
      setFilteredProducts(data);
    } else {
      const filtered = data.filter((product) => {
        const isCategoryMatch = selectedItems.includes(product.categoryId);
        const isSearchMatch = search && product.category.parentId === search;
        return isCategoryMatch || isSearchMatch;
      });
      setFilteredProducts(filtered);
    }
  }, [selectedItems, data, search]);

  useEffect(() => {
    if (!search) return;

    const matchedCategory = categoryOption.find(
      (item) =>
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    if (matchedCategory) {
      const allChildIds =
        matchedCategory.children?.map((child) => child.id) || [];
      const currentItems = form.getValues("items") || [];

      const updatedItems = [...new Set([...currentItems, ...allChildIds])];

      form.setValue("items", updatedItems);
    }

    if (search) {
      const filteredByCategory = data.filter(
        (product) => product.category.parentId === search
      );
      setFilteredProducts(filteredByCategory);
    }
  }, [search, categoryOption, form, data]);

  const filterProducts = (searchTerm: string, categories: string[]) => {
    return data.filter((product) => {
      const isCategoryMatch =
        categories.length === 0 || categories.includes(product.categoryId);
      const isSearchMatch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (product.category.parent &&
          product.category.parent.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      return isCategoryMatch && isSearchMatch;
    });
  };

  const clearAllFilters = () => {
    router.push("/category/products");
    form.reset({ items: [] });
    setFilteredProducts(data);
  };

  return (
    <div>
      <div className="flex justify-between gap-x-3 items-center content-center">
        <SearchInput
          className="sm:w-3/6 w-full  mx-auto"
          placeholder={t("search")}
          onChange={(e) => {
            const searchTerm = e.target.value;
            const filtered = filterProducts(searchTerm, selectedItems);
            setFilteredProducts(filtered);
          }}
        />
        <div className="sm:hidden mt-3 block">
          <CategorySideBar
            categoryOption={categoryOption}
            form={form}
            clearAllFilters={clearAllFilters}
            isAllChildrenChecked={isAllChildrenChecked}
            toggleParentCheckbox={toggleParentCheckbox}
            openCategory={openCategory}
            handleToggle={handleToggle}
          />
        </div>
      </div>
      <div className="mt-10 sm:flex">
        <div className="border-2 overflow-y-scroll sm:block hidden  w-96 min-w-8 border-primary h-[713px] rounded-lg p-3">
          <div className="w-full bg-white sticky flex justify-between items-center -top-0 z-10 px-3 py-2.5">
            <h1 className="text-primary font-semibold text-xl">
              {t("categories")}
            </h1>
            <Button
              onClick={clearAllFilters}
              variant={"outline"}
              className="text-primary border border-primary"
            >
              {t("clear")}
            </Button>
          </div>

          <Accordion type="multiple" className="px-3">
            <Form {...form}>
              <FormField
                control={form.control}
                name="items"
                render={() => (
                  <FormItem className="-space-y-2.5">
                    {categoryOption.map((item) => (
                      <AccordionItem value={item.id} key={item.id}>
                        <div className="flex items-center w-full">
                          <FormField
                            control={form.control}
                            name="items"
                            render={({ field }) => (
                              <div className="flex items-center gap-x-2 w-full">
                                <Checkbox
                                  checked={isAllChildrenChecked(
                                    field,
                                    item.children
                                  )}
                                  onCheckedChange={() =>
                                    toggleParentCheckbox(
                                      field,
                                      item.id,
                                      item.children
                                    )
                                  }
                                />
                                <AccordionTrigger
                                  onClick={() => handleToggle(item.id)}
                                  className="flex items-center w-full no-underline"
                                >
                                  <FormLabel className="text-[16px] md:w-[10rem] truncate font-medium ml-2">
                                    {item.name}
                                  </FormLabel>
                                  <div className="flex items-center justify-center">
                                    {openCategory === item.id ? (
                                      <MinusIcon className="scale-90" />
                                    ) : (
                                      <PlusIcon className="scale-90" />
                                    )}
                                  </div>
                                </AccordionTrigger>
                              </div>
                            )}
                          />
                        </div>

                        <AccordionContent>
                          <div className="ml-6 space-y-2">
                            {item.children?.map((child) => (
                              <FormField
                                key={child.id}
                                control={form.control}
                                name="items"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          child.id
                                        )}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                child.id,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (v: string) => v !== child.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {child.name}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </Accordion>
        </div>

        <div className="w-full sm:ml-2 ml-0">
          {filteredProducts.length > 0 ? (
            <div className="grid justify-between ml-2 mt-5 sm:grid-cols-3 md:grid-cols-5 grid-cols-2 gap-x-2">
              {filteredProducts.map((item, index) => (
                <SellingCard key={item.id || index} data={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500 text-lg">No products found</p>
              <Button
                variant="outline"
                className="mt-4 text-primary"
                onClick={clearAllFilters}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
