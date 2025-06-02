import { Search } from 'lucide-react';
import React from 'react'
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

const SearchInput = ({ prefix, className, type, ...props }: React.ComponentProps<"input">) => {
    const { register } = useForm();

    return (
        <div className={`flex items-center border border-[#10847E80] p-1 rounded-full overflow-hidden ${className} `}>
            <span className="pl-3 text-gray-500">
                <Search className="w-5   text-[#10847E80]" />
            </span>
            <input
                {...register("name")}
                type={type}
                prefix={prefix}
                data-slot="input"
                className={cn("flex-1 border-none py-1.5 bg-transparent focus:outline-none focus:ring-0 px-3 text-[#10847E80]")}
                {...props}
            />

            {/* <Button className={`px-4 py-2 bg-[#10847E] text-white rounded-full hover:bg-[#0e756f] `}>
                Search
            </Button> */}
        </div>
    );
};


export default SearchInput