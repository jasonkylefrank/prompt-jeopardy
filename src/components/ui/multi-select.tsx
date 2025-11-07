
"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Option = {
  category: string;
  options: string[];
}

type MultiSelectProps = {
  options: string[] | Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder?: string;
  max?: number;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder = "Select...",
  max,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const handleSelect = (currentValue: string) => {
    if (selected.includes(currentValue)) {
      onChange(selected.filter((item) => item !== currentValue));
    } else {
      if (max && selected.length >= max) {
        toast({
            title: "Limit Reached",
            description: `You can only select up to ${max} items.`,
            variant: "destructive"
        })
      } else {
        onChange([...selected, currentValue]);
      }
    }
  };

  const isCategorized = (option: any): option is Option => {
    return typeof option === 'object' && option !== null && 'category' in option && Array.isArray(option.options);
  }
  
  const isMaxReached = max !== undefined && selected.length >= max;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10", className)}
        >
          <div className="flex flex-wrap items-center gap-1">
            {selected.length > 0 ? (
              selected.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="mb-1 mr-1 whitespace-nowrap"
                >
                  {item}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandList>
            {options.map((option, index) => {
              if (isCategorized(option)) {
                return (
                  <CommandGroup key={option.category} heading={option.category}>
                    {option.options.map((item) => (
                      <CommandItem
                        key={item}
                        onSelect={() => handleSelect(item)}
                        disabled={isMaxReached && !selected.includes(item)}
                        className={cn(isMaxReached && !selected.includes(item) ? 'cursor-not-allowed text-muted-foreground' : '')}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selected.includes(item)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {item}
                      </CommandItem>
                    ))}
                    {index < options.length - 1 && options.length > 1 && <CommandSeparator />}
                  </CommandGroup>
                )
              }
              if (typeof option === 'string') {
                 return (
                    <CommandItem
                        key={option}
                        onSelect={() => handleSelect(option)}
                        disabled={isMaxReached && !selected.includes(option)}
                         className={cn(isMaxReached && !selected.includes(option) ? 'cursor-not-allowed text-muted-foreground' : '')}
                    >
                        <Check
                        className={cn(
                            "mr-2 h-4 w-4",
                            selected.includes(option) ? "opacity-100" : "opacity-0"
                        )}
                        />
                        {option}
                    </CommandItem>
                )
              }
              return null;
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
