'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { saveNoteAction } from '@/app/actions';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { NoteMetadata } from '@/lib/notes';
import { useTabs } from './tabs-context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List as ListIcon, 
  Code, 
  Table as TableIcon
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { blockIconGutter, autocompleteExtensions } from '@/lib/editor/cm-extensions';
import { MiniGraphView } from './mini-graph-view';

interface EditorProps {
  slug: string;
  initialContent: string;
  allNotes: NoteMetadata[];
  graphData: any;
  backlinks: any[];
}

export function Editor({ slug, initialContent, allNotes, graphData, backlinks: initialBacklinks }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const debouncedContent = useDebounce(content, 750);
  const { openTab } = useTabs();
  const codeMirrorRef = useRef<ReactCodeMirrorRef>(null);

  useEffect(() => {
    const title = decodeURIComponent(slug).split('/').pop() || '';
    openTab({ slug, title });
  }, [slug, openTab]);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const saveContent = useCallback(async (newContent: string) => {
    const result = await saveNoteAction(slug, newContent);
    if (!result.success) {
      toast.error('Failed to auto-save');
    }
  }, [slug]);

  useEffect(() => {
    if (debouncedContent !== initialContent && !isReadOnly) {
      saveContent(debouncedContent);
    }
  }, [debouncedContent, initialContent, saveContent, isReadOnly]);

  const viewContent = useMemo(() => {
    if (!content) return '';
    let processed = content;
    
    // Transform [[WikiLink]] syntax to Markdown links for viewing
    processed = processed.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
      const parts = p1.split('|');
      const target = parts[0];
      const display = parts[1] || target;
      return `[${display}](/note/${encodeURIComponent(target)})`;
    });

    // Protect code blocks and inline code
    const codeBlocks: string[] = [];
    processed = processed.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
    
    const inlineCode: string[] = [];
    processed = processed.replace(/`[^`]+`/g, (match) => {
      inlineCode.push(match);
      return `__INLINE_CODE_${inlineCode.length - 1}__`;
    });

    // Process Hashtags into Chips
    processed = processed.replace(/(^|\s)#([a-zA-Z0-9_]+)/g, '$1<span class="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/30 cursor-pointer hover:bg-primary/30 transition-colors mx-1 mb-1">#$2</span>');

    // Restore inline code
    processed = processed.replace(/__INLINE_CODE_(\d+)__/g, (_, idx) => inlineCode[parseInt(idx)]);
    // Restore code blocks
    processed = processed.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[parseInt(idx)]);

    return processed;
  }, [content]);

  const insertFormat = (prefix: string, suffix: string = '') => {
    const view = codeMirrorRef.current?.view;
    if (!view) return;

    const selection = view.state.selection.main;
    const selectedText = view.state.sliceDoc(selection.from, selection.to);
    
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: prefix + selectedText + suffix
      },
      selection: { 
        anchor: selection.from + prefix.length, 
        head: selection.from + prefix.length + selectedText.length 
      }
    });
    view.focus();
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allNotes.forEach(note => {
      const noteTags = note.title.match(/#[a-zA-Z0-9_]+/g) || [];
      noteTags.forEach(t => tags.add(t.substring(1)));
    });
    return Array.from(tags).length ? Array.from(tags) : ['idea', 'todo', 'meeting', 'project', 'important'];
  }, [allNotes]);

  const transparentTheme = EditorView.theme({
    "&": {
      backgroundColor: "transparent !important",
    },
    ".cm-gutters": {
      backgroundColor: "transparent !important",
      borderRight: "1px solid rgba(255, 255, 255, 0.1)",
      color: "rgba(255,255,255,0.4)"
    },
    ".cm-activeLine, .cm-activeLineGutter": {
      backgroundColor: "rgba(255, 255, 255, 0.03) !important",
    },
    ".cm-block-icons .cm-gutterElement": {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "0 4px",
      minWidth: "24px"
    }
  });

  const cmExtensions = useMemo(() => [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    blockIconGutter,
    autocompleteExtensions(allTags, allNotes),
    transparentTheme
  ], [allTags, allNotes, transparentTheme]);

  const BacklinksSection = () => {
    if (!initialBacklinks || initialBacklinks.length === 0) return null;
    return (
      <div className="mt-16 pt-8 border-t border-white/10">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {initialBacklinks.length} {initialBacklinks.length === 1 ? 'mention' : 'mentions'} in other notes
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {initialBacklinks.map((link) => (
            <Link
              key={link.slug}
              href={`/note/${link.slug}`}
              className="group block p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center gap-2 font-medium mb-1">
                <div className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity">
                   <ListIcon className="h-4 w-4" />
                </div>
                <span className="text-sm">{link.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
                {link.snippet}
              </p>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col xl:flex-row">
      <div className="flex-1 max-w-4xl mx-auto py-12 px-6 w-full">
        {/* Main Toolbar */}
        <div className="sticky top-0 z-30 flex flex-col items-center pt-4 pointer-events-none mb-6">
          <div className="flex items-center gap-4 bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl pointer-events-auto transition-all">
            <div className="flex items-center gap-2 px-3 border-r border-white/10 mr-1">
              <Switch 
                id="read-mode" 
                checked={isReadOnly} 
                onCheckedChange={setIsReadOnly}
              />
              <Label htmlFor="read-mode" className="text-[10px] uppercase tracking-widest font-bold opacity-50 cursor-pointer select-none">
                {isReadOnly ? 'View' : 'Edit'}
              </Label>
            </div>
            
            {!isReadOnly ? (
              <div className="flex items-center gap-1 pr-2">
                <button onClick={() => insertFormat('# ')} className="p-1 hover:bg-white/10 rounded" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
                <button onClick={() => insertFormat('## ')} className="p-1 hover:bg-white/10 rounded" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
                <Separator orientation="vertical" className="mx-1 h-4 bg-white/10" />
                <button onClick={() => insertFormat('**', '**')} className="p-1 hover:bg-white/10 rounded" title="Bold"><Bold className="w-4 h-4" /></button>
                <button onClick={() => insertFormat('*', '*')} className="p-1 hover:bg-white/10 rounded" title="Italic"><Italic className="w-4 h-4" /></button>
                <Separator orientation="vertical" className="mx-1 h-4 bg-white/10" />
                <button onClick={() => insertFormat('- ')} className="p-1 hover:bg-white/10 rounded" title="Bullet List"><ListIcon className="w-4 h-4" /></button>
                <button onClick={() => insertFormat('```\n', '\n```')} className="p-1 hover:bg-white/10 rounded" title="Code Block"><Code className="w-4 h-4" /></button>
                <Separator orientation="vertical" className="mx-1 h-4 bg-white/10" />
                <button onClick={() => insertFormat('\n| Header | Header | Header |\n|--------|--------|--------|\n| Cell   | Cell   | Cell   |\n')} className="p-1 hover:bg-white/10 rounded" title="Insert Table"><TableIcon className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center px-4 py-1 text-[10px] uppercase tracking-widest font-bold text-white/30 italic">
                View Only Mode
              </div>
            )}
          </div>
        </div>

        <div className="w-full h-full relative">
          {isReadOnly ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  a: ({ node, ...props }) => {
                    if (props.href?.startsWith('/note/')) {
                      return <Link href={props.href}>{props.children}</Link>;
                    }
                    return <a {...props} target="_blank" rel="noopener noreferrer">{props.children}</a>;
                  },
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isBlock = match || String(children).includes('\n');
                    
                    return isBlock ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={match ? match[1] : 'typescript'}
                        PreTag="div"
                        customStyle={{ backgroundColor: 'transparent', padding: 0, margin: '1em 0' }}
                        className="!bg-transparent text-[13px]"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-white/10 px-1.5 py-0.5 rounded-md text-[0.9em] font-mono text-primary/90" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {viewContent}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="relative w-full h-[calc(100vh-200px)] rounded-md overflow-hidden bg-transparent">
              <CodeMirror
                ref={codeMirrorRef}
                value={content}
                height="100%"
                theme="dark"
                extensions={cmExtensions}
                onChange={(val) => setContent(val)}
                className="h-full text-base font-mono"
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  autocompletion: true,
                }}
              />
            </div>
          )}
        </div>
        
        <BacklinksSection />
      </div>

      <div className="hidden xl:block w-80 shrink-0 sticky top-12 pr-6 pt-12">
        <MiniGraphView currentSlug={slug} currentContent={content} globalData={graphData} />
      </div>
    </div>
  );
}
