"use client";

import { useState } from "react";
import { Wrench, Database, Mail, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const devLinks = [
  {
    name: "Supabase Studio",
    url: "http://localhost:54323",
    icon: Database,
    description: "Database management",
  },
  {
    name: "Inbucket (Email)",
    url: "http://localhost:54324",
    icon: Mail,
    description: "View sent emails",
  },
];

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-dashed border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
        >
          <Wrench className="h-4 w-4" />
          Dev Tools
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Local Development</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {devLinks.map((link) => (
          <DropdownMenuItem key={link.name} asChild>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <link.icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{link.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {link.description}
                  </div>
                </div>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
