"use client";

import { useState, useRef, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import PlusIcon from "@/../public/icons/plusCircle.svg";
import MinusIcon from "@/../public/icons/minusCircle.svg";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { t } from "@/utils/translate";

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface SidebarProps {
  categoryOption: Category[];
  form: any;
  clearAllFilters: () => void;
  isAllChildrenChecked: (field: any, children?: Category[]) => boolean;
  toggleParentCheckbox: (field: any, id: string, children?: Category[]) => void;
  openCategory: string | null;
  handleToggle: (id: string) => void;
}

export default function CategorySideBar({
  categoryOption,
  form,
  clearAllFilters,
  isAllChildrenChecked,
  toggleParentCheckbox,
  openCategory,
  handleToggle,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        mobileOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [mobileOpen]);

  const SidebarContent = (
    <>
      <div className="flex justify-between items-center px-4 py-2 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-primary">
          {t("categories")}
        </h2>
        <Button
          variant="outline"
          className="text-primary border-primary h-8"
          onClick={clearAllFilters}
        >
          {t("clear")}
        </Button>
      </div>

      <div className="px-2 ml-4 mr-3 py-1 overflow-y-auto h-[calc(100vh-64px)]">
        <Accordion type="multiple" className="space-y-1">
          <Form {...form}>
            <FormField
              control={form.control}
              name="items"
              render={() => (
                <FormItem className="space-y-1">
                  {categoryOption.map((item) => (
                    <AccordionItem
                      value={item.id}
                      key={item.id}
                      className="border-b-0"
                    >
                      {/* Parent row */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center">
                          <FormField
                            control={form.control}
                            name="items"
                            render={({ field }) => (
                              <FormControl>
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
                                  className="h-4 w-4"
                                />
                              </FormControl>
                            )}
                          />
                          <FormLabel className="ml-2 truncate text-sm font-medium">
                            {item.name}
                          </FormLabel>
                        </div>
                        <AccordionTrigger
                          onClick={() => handleToggle(item.id)}
                          className="  flex items-center justify-center overflow-visible no-underline"
                        >
                          {openCategory === item.id ? (
                            <MinusIcon className=" relative z-50  scale-[0.8]  " />
                          ) : (
                            <PlusIcon className=" relative z-50  scale-[0.8]  " />
                          )}
                        </AccordionTrigger>
                      </div>

                      {/* Children */}
                      <AccordionContent className="pt-0 pb-1">
                        <div className="ml-6 space-y-0">
                          {item.children?.map((child) => (
                            <FormField
                              key={child.id}
                              control={form.control}
                              name="items"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between px-1 py-0.5">
                                  <div className="flex items-center">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          child.id
                                        )}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([
                                              ...(field.value || []),
                                              child.id,
                                            ]);
                                          } else {
                                            field.onChange(
                                              field.value?.filter(
                                                (v: string) => v !== child.id
                                              )
                                            );
                                          }
                                        }}
                                        className="h-4 w-4"
                                      />
                                    </FormControl>
                                    <FormLabel className="ml-2 text-xs">
                                      {child.name}
                                    </FormLabel>
                                  </div>
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
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:block border-2 border-primary w-80 h-[713px] rounded-lg overflow-hidden">
        {SidebarContent}
      </aside>

      {/* Mobile drawer trigger */}
      <button
        className="sm:hidden px-4 py-2 bg-primary text-white rounded mb-2"
        onClick={() => setMobileOpen(true)}
      >
        {t("filter")}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" />
      )}

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white shadow-xl z-50 transform transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-2">
          <h2 className="text-lg font-semibold">{t("filters")}</h2>
          <button
            aria-label={t("close_filters")}
            onClick={() => setMobileOpen(false)}
            className="text-2xl p-1"
          >
            <IoClose />
          </button>
        </div>
        {SidebarContent}
      </div>
    </>
  );
}
