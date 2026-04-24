'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getNoteContentAction } from '@/app/actions';
import { useTheme } from 'next-themes';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

interface ExcalidrawEmbedProps {
  slug: string;
}

export function ExcalidrawEmbed({ slug }: ExcalidrawEmbedProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let isMounted = true;

    async function fetchAndProcess() {
      const result = await getNoteContentAction(slug);
      if (!isMounted) return;

      if (result.success && result.content) {
        try {
          const parsedData = JSON.parse(result.content);
          setData(parsedData);
          
          // Dynamically import exportToSvg and generate SVG
          const { exportToSvg } = await import('@excalidraw/excalidraw');
          
          if (exportToSvg && parsedData.elements && isMounted) {
            const svg = await exportToSvg({
              elements: parsedData.elements,
              appState: {
                ...parsedData.appState,
                exportWithBlur: false,
                exportBackground: true,
                viewBackgroundColor: '#ffffff'
              },
              files: parsedData.files,
              exportPadding: 10,
            });
            
            const svgString = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            setSvgUrl(URL.createObjectURL(blob));
          }
        } catch (e) {
          console.error('Failed to process excalidraw data', e);
        }
      }
      setLoading(false);
    }

    fetchAndProcess();
    return () => { isMounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white/5 animate-pulse rounded-lg my-4 border border-white/5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Loading Drawing...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono my-4">
        Could not load excalidraw file: {slug}
      </div>
    );
  }

  return (
    <div className="relative group my-4 border-l-4 border-primary/40 pl-4 h-[400px] bg-background rounded-xl overflow-hidden border border-border print:border-none print:pl-0 print:h-auto print:min-h-0">
      {/* Live version for app */}
      <div className="w-full h-full no-print">
        <Excalidraw
          initialData={{
            elements: data.elements || [],
            appState: { 
              ...data.appState,
              viewModeEnabled: true,
              zenModeEnabled: true,
              viewBackgroundColor: 'transparent'
            },
            files: data.files || {},
          }}
          viewModeEnabled={true}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        />
      </div>

      {/* Static SVG for PDF export */}
      {svgUrl && (
        <div className="hidden print:block w-full">
          <img 
            src={svgUrl} 
            alt="Excalidraw Diagram" 
            className="w-full h-auto max-h-[800px] object-contain"
          />
        </div>
      )}

      <div className="absolute bottom-2 right-2 pointer-events-none z-10 no-print">
        <span className="text-[10px] bg-black/50 px-2 py-1 rounded text-white/40 font-medium tracking-wider uppercase backdrop-blur-sm">Excalidraw Drawing</span>
      </div>
    </div>
  );
}
