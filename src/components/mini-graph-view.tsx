'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

interface Node {
  id: string;
  title: string;
  type: 'note' | 'tag';
  x?: number;
  y?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface MiniGraphViewProps {
  currentSlug: string;
  currentContent: string;
  globalData: GraphData;
}

export function MiniGraphView({ currentSlug, currentContent, globalData }: MiniGraphViewProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const localGraphData = useMemo(() => {
    const nodesMap = new Map<string, Node>();
    globalData.nodes.forEach(node => nodesMap.set(node.id, { ...node }));

    // 1. Find all BACKLINKS (from global data)
    const backlinks = globalData.links.filter(link => {
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return targetId === currentSlug;
    });

    // 2. Parse CURRENT CONTENT for OUTLINKS and TAGS
    const outlinks: Link[] = [];
    const tags: Link[] = [];
    
    // WikiLinks [[Target]]
    const wikiLinkRegex = /\[\[(.*?)(?:\|.*?)?\]\]/g;
    let match;
    while ((match = wikiLinkRegex.exec(currentContent)) !== null) {
      const linkTarget = match[1];
      // Try to find node by ID or title
      const targetNode = globalData.nodes.find(n => n.id === linkTarget || n.title === linkTarget);
      if (targetNode && targetNode.id !== currentSlug) {
        outlinks.push({ source: currentSlug, target: targetNode.id });
      }
    }

    // Tags #tag
    const tagRegex = /(?:^|\s)#([a-zA-Z0-9_]+)/g;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(currentContent)) !== null) {
      const tagName = tagMatch[1];
      const tagId = `tag:${tagName}`;
      if (!nodesMap.has(tagId)) {
        nodesMap.set(tagId, { id: tagId, title: `#${tagName}`, type: 'tag' });
      }
      tags.push({ source: currentSlug, target: tagId });
    }

    // Collect all relevant node IDs
    const relevantNodeIds = new Set<string>();
    relevantNodeIds.add(currentSlug);
    
    const allLinks = [...backlinks, ...outlinks, ...tags];
    allLinks.forEach(link => {
      const s = typeof link.source === 'string' ? link.source : link.source.id;
      const t = typeof link.target === 'string' ? link.target : link.target.id;
      relevantNodeIds.add(s);
      relevantNodeIds.add(t);
    });

    // Filter nodes and cleanup links
    const filteredNodes = Array.from(relevantNodeIds)
      .map(id => nodesMap.get(id))
      .filter((n): n is Node => !!n);

    const filteredLinks = allLinks.map(l => ({
      source: typeof l.source === 'string' ? l.source : l.source.id,
      target: typeof l.target === 'string' ? l.target : l.target.id
    }));

    return { nodes: filteredNodes, links: filteredLinks };
  }, [currentSlug, currentContent, globalData]);

  if (!mounted) return null;

  return (
    <div className="w-full h-64 bg-[#080808] rounded-xl overflow-hidden border border-white/5 relative flex flex-col">
      <div className="absolute top-2 left-3 z-10">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Local Graph</span>
      </div>
      <div className="flex-1">
        <ForceGraph2D
          graphData={localGraphData}
          nodeLabel="title"
          backgroundColor="#080808"
          linkColor={() => 'rgba(255, 255, 255, 0.15)'}
          linkWidth={1}
          nodeRelSize={4}
          width={320}
          height={256}
          onNodeClick={(node: any) => {
            if (node.type === 'note' && node.id !== currentSlug) {
              router.push(`/note/${node.id}`);
            }
          }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const isCurrent = node.id === currentSlug;
            const label = node.title;
            const fontSize = (isCurrent ? 14 : 10) / globalScale;
            ctx.font = `${fontSize}px Inter`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.type === 'tag' ? 2 : (isCurrent ? 4 : 3), 0, 2 * Math.PI, false);
            ctx.fillStyle = node.type === 'tag' ? '#a855f7' : (isCurrent ? '#10b981' : '#3b82f6');
            ctx.fill();

            // Label
            if (globalScale > 1.2 || isCurrent) {
              ctx.fillStyle = 'rgba(15, 15, 15, 0.8)';
              ctx.roundRect(
                node.x - bckgDimensions[0] / 2, 
                node.y + 5, 
                bckgDimensions[0] as number, 
                bckgDimensions[1] as number,
                2
              );
              ctx.fill();

              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillStyle = node.type === 'tag' ? '#d8b4fe' : (isCurrent ? '#34d399' : 'rgba(255, 255, 255, 0.8)');
              ctx.fillText(label, node.x, node.y + 6);
            }
          }}
        />
      </div>
    </div>
  );
}
