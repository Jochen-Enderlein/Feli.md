'use client';

import * as React from 'react';
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarTriggerInternal() {
  const { state } = useSidebar();
  
  return (
    <div className={cn(
      "absolute top-3 z-50 flex items-center gap-2 no-print transition-all duration-300 left-3"
    )}>
      <SidebarTrigger className="h-8 w-8 opacity-30 hover:opacity-100 transition-all text-foreground hover:bg-accent rounded-xl" />
    </div>
  );
}
