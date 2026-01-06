"use client";

import * as React from "react";
import { icons, type LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Convert PascalCase to kebab-case for storage
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

// Convert kebab-case to PascalCase for lookup
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

// Get all icon names (excluding internal ones)
const allIconNames = Object.keys(icons).filter(
  (name) => !name.endsWith("Icon") && name !== "createLucideIcon"
);

// Maximum icons to show initially (for performance)
const MAX_INITIAL_ICONS = 100;

interface IconPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function IconPicker({
  value,
  onChange,
  placeholder = "Select icon...",
  className,
}: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Get the selected icon component
  const selectedIconName = value ? toPascalCase(value) : null;
  const SelectedIcon = selectedIconName
    ? (icons[selectedIconName as keyof typeof icons] as LucideIcon)
    : null;

  // Filter icons based on search
  const filteredIcons = React.useMemo(() => {
    if (!search) {
      return allIconNames.slice(0, MAX_INITIAL_ICONS);
    }
    const searchLower = search.toLowerCase();
    return allIconNames.filter((name) =>
      name.toLowerCase().includes(searchLower)
    );
  }, [search]);

  const handleSelect = (iconName: string) => {
    const kebabName = toKebabCase(iconName);
    onChange?.(kebabName);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-start gap-2", className)}
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon className="h-4 w-4" />
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search icons..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No icons found.</CommandEmpty>
            <CommandGroup>
              <div className="grid grid-cols-6 gap-1 p-2">
                {filteredIcons.map((iconName) => {
                  const Icon = icons[iconName as keyof typeof icons] as LucideIcon;
                  const kebabName = toKebabCase(iconName);
                  const isSelected = value === kebabName;

                  return (
                    <CommandItem
                      key={iconName}
                      value={iconName}
                      onSelect={() => handleSelect(iconName)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-md p-0 cursor-pointer",
                        isSelected && "bg-primary text-primary-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </CommandItem>
                  );
                })}
              </div>
            </CommandGroup>
            {!search && filteredIcons.length === MAX_INITIAL_ICONS && (
              <p className="p-2 text-center text-xs text-muted-foreground">
                Type to search {allIconNames.length} icons...
              </p>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Utility component to render an icon by name
interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
  const pascalName = toPascalCase(name);
  const Icon = icons[pascalName as keyof typeof icons] as LucideIcon | undefined;

  if (!Icon) {
    return <span className={cn("inline-block", className)}>?</span>;
  }

  return <Icon className={className} />;
}
