import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ prefix,className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <>
    <input
      type={type}
      prefix={prefix}
      data-slot="input"
      className={cn(
        "border-[#10847E80] text-[#10847E80] file:text-foreground placeholder:text-muted-foreground selection:bg-[#10847E80] selection:text-white flex h-10 w-full min-w-0 rounded-[10px] border-[2px] bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[#10847E80] focus-visible:ring-[#10847E80]/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
    </>
  );
}

export { Input };
