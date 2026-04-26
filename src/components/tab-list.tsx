'use client';

import React from 'react';
import Link from 'next/link';
import { X, FileText, Pencil } from 'lucide-react';
import { useTabs } from './tabs-context';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

export function TabList() {
  const { tabs, activeTab, closeTab } = useTabs();
  const { state } = useSidebar();
  
  const isMac = React.useMemo(() => {
    return typeof window !== 'undefined' && window.electron?.platform === 'darwin';
  }, []);

  if (tabs.length === 0) return null;

  return (
    <div className={cn(
      "flex items-center gap-1 overflow-x-auto no-scrollbar h-full transition-all duration-300",
      isMac && state === "collapsed" ? "pl-20" : "px-2"
    )}>
      {tabs.map((tab) => (
        <div
          key={tab.slug}
          className={cn(
            "group relative flex items-center h-8 px-3 gap-2 min-w-[100px] max-w-[180px] text-[12px] font-medium rounded-md transition-all duration-200 select-none",
            activeTab === tab.slug
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <Link href={`/note/${tab.slug}`} className="flex-1 flex items-center gap-2 truncate pr-4">
            {tab.slug.toLowerCase().endsWith('.excalidraw') ? (
              <Pencil className="h-3.5 w-3.5 opacity-50" />
            ) : (
              <FileText className="h-3.5 w-3.5 opacity-50" />
            )}
            <span className="truncate">{tab.title.replace(/\.(md|excalidraw)$/i, '')}</span>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeTab(tab.slug);
            }}
            className="absolute right-1.5 opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-background/20 transition-all duration-200"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
