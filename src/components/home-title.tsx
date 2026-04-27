'use client';

import { useTabs } from "@/components/tabs-context";
import { getReadmeAction } from "@/app/actions";
import { toast } from "sonner";
import React from 'react';

export function HomeTitle() {
  const { setIsReadmeOpen } = useTabs();

  return (
    <h2 
      className="text-3xl font-bold text-foreground tracking-tight cursor-pointer hover:text-primary transition-colors"
      onClick={async () => {
        // We don't have the readmeContent here, but LayoutWrapper handles the Dialog.
        // We just need to trigger the open state. 
        // Wait, LayoutWrapper fetches content when handleOpenReadme is called.
        // If we just set setIsReadmeOpen(true), the content might be empty.
        // Let's add a way to fetch it or just set a flag.
        
        // Actually, LayoutWrapper could listen to isReadmeOpen and fetch if empty.
        setIsReadmeOpen(true);
      }}
    >
      Feli.md
    </h2>
  );
}
