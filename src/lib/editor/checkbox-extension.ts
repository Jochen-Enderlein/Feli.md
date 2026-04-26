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

class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean, readonly pos: number) {
    super();
  }

  eq(other: CheckboxWidget) {
    return other.checked === this.checked && other.pos === this.pos;
  }

  toDOM(view: EditorView) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.checked;
    input.className = "cm-task-list-checkbox";
    input.style.marginRight = "4px";
    input.style.cursor = "pointer";
    input.style.verticalAlign = "middle";
    input.style.position = "relative";
    input.style.top = "-1px";

    input.onchange = (e) => {
      const isChecked = (e.target as HTMLInputElement).checked;
      const line = view.state.doc.lineAt(this.pos);
      const lineText = line.text;
      
      // Match something like "- [ ] " or "* [x] "
      const match = lineText.match(/^(\s*[-*+]\s+\[)([ xX])(\].*)$/);
      if (match) {
        const newChar = isChecked ? "x" : " ";
        const newText = match[1] + newChar + match[3];
        
        view.dispatch({
          changes: {
            from: line.from,
            to: line.to,
            insert: newText
          }
        });
      }
    };

    return input;
  }

  ignoreEvent() {
    return false;
  }
}

export const checkboxExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.getDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = this.getDecorations(update.view);
      }
    }

    getDecorations(view: EditorView): DecorationSet {
      const widgets: Range<Decoration>[] = [];
      const selection = view.state.selection.main;
      
      for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from,
          to,
          enter: (node) => {
            if (node.name === "Task") {
              // The "Task" node in CodeMirror markdown usually covers the "[ ]" or "[x]" part
              const text = view.state.sliceDoc(node.from, node.to);
              const checked = text.toLowerCase().includes("x");
              
              // Only show widget if cursor is NOT on this line
              const line = view.state.doc.lineAt(node.from);
              const isCursorOnLine = selection.from >= line.from && selection.from <= line.to;

              if (!isCursorOnLine) {
                const deco = Decoration.replace({
                  widget: new CheckboxWidget(checked, node.from),
                });
                widgets.push(deco.range(node.from, node.to));
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
