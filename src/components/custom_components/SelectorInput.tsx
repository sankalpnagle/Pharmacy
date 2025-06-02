"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



export default function SelectorInput({
  options,
  placeholder ,
  value,
  className = "",
  onChange,
}) {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger
        className={`border-2 py-[1.4rem] text-primary rounded-xl mt-1.5 px-5 border-primary-light w-full max-w-md flex justify-between ${className}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent className="bg-white text-primary w-full max-w-md">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="hover:bg-primary/10 text-md"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
