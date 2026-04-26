import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";

class TableEditWidget extends WidgetType {
  constructor(readonly pos: number, readonly onEdit: (pos: number) => void) {
    super();
  }

  eq(other: TableEditWidget) {
    return other.pos === this.pos;
  }

  toDOM() {
    const btn = document.createElement("button");
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
      Edit Table
    `;
    btn.className = "cm-table-edit-button";
    btn.style.cssText = `
      position: absolute;
      right: 10px;
      top: 0px;
      z-index: 10;
      background: var(--secondary);
      color: var(--secondary-foreground);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: auto;
    `;

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onEdit(this.pos);
    };

    // Wrapper to handle hover since the button is absolute
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.height = "0";
    wrapper.style.width = "100%";
    wrapper.appendChild(btn);

    return wrapper;
  }

  ignoreEvent() {
    return true;
  }
}

export const tableEditExtension = (onEdit: (pos: number) => void) => ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.getDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.getDecorations(update.view);
      }
    }

    getDecorations(view: EditorView): DecorationSet {
      const widgets: Range<Decoration>[] = [];
      let lastTableStart = -1;

      for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from,
          to,
          enter: (node) => {
            // Check for Table rows. In CM markdown, tables are often blocks or groups of lines
            const line = view.state.doc.lineAt(node.from);
            if (line.text.includes('|') && !line.text.match(/^\|?(\s*:?---*:?\s*\|?)+\s*$/)) {
              // Only place widget on the first line of a table
              let isFirstLine = true;
              if (line.number > 1) {
                const prevLine = view.state.doc.line(line.number - 1);
                if (prevLine.text.includes('|')) isFirstLine = false;
              }

              if (isFirstLine && line.from !== lastTableStart) {
                lastTableStart = line.from;
                const deco = Decoration.widget({
                  widget: new TableEditWidget(line.from, onEdit),
                  side: 1
                });
                widgets.push(deco.range(line.from));
              }
            }
          },
        });
      }

      return Decoration.set(widgets, true);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

export const tableEditTheme = EditorView.baseTheme({
  ".cm-line:hover .cm-table-edit-button": {
    opacity: "1 !important"
  }
});
