import { getGraphData, getNotes, getFolders } from "@/lib/notes";
import { GraphView } from "@/components/graph-view";
import { LayoutWrapper } from "@/components/layout-wrapper";

export const dynamic = 'force-dynamic';

export default async function GraphPage() {
  const notes = await getNotes();
  const folders = await getFolders();
  const graphData = await getGraphData();

  return (
    <LayoutWrapper notes={notes} folders={folders}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-background">
        </div>
        <div className="flex-1 p-4">
          <GraphView data={graphData} />
        </div>
      </div>
    </LayoutWrapper>
  );
}
