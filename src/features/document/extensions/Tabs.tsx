"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Pencil, Plus, X } from "lucide-react";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const tabDecorationPluginKey = new PluginKey("tabDecorations");

function createTabDecorationPlugin() {
  return new Plugin({
    key: tabDecorationPluginKey,
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];
        state.doc.descendants((node, pos) => {
          if (node.type.name === "tabs") {
            const activeTab: number = node.attrs.activeTab ?? 0;
            let childOffset = 1;
            for (let i = 0; i < node.childCount; i++) {
              const child = node.child(i);
              if (child.type.name === "tab" && i === activeTab) {
                decorations.push(
                  Decoration.node(pos + childOffset, pos + childOffset + child.nodeSize, {
                    class: "active-tab",
                  })
                );
              }
              childOffset += child.nodeSize;
            }
          }
        });
        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}

function TabsNodeView({ node, getPos, editor }: NodeViewProps) {
  const activeTab: number = node.attrs.activeTab ?? 0;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tabs = useMemo(() => {
    const list: { title: string }[] = [];
    for (let i = 0; i < node.childCount; i++) {
      list.push({ title: node.child(i).attrs.title || `Tab ${i + 1}` });
    }
    return list;
  }, [node]);

  const switchTab = useCallback(
    (index: number) => {
      if (!editor.isEditable) return;
      const pos = getPos();
      if (pos == null) return;
      editor.view.dispatch(
        editor.view.state.tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          activeTab: index,
        })
      );
    },
    [editor, getPos, node.attrs]
  );

  const addTab = useCallback(() => {
    if (!editor.isEditable) return;
    const pos = getPos();
    if (pos == null) return;

    const { state } = editor.view;
    const tabType = state.schema.nodes.tab;
    const paragraphType = state.schema.nodes.paragraph;

    if (!tabType || !paragraphType) return;

    const newTitle = `Tab ${node.childCount + 1}`;
    const paragraph = paragraphType.create();
    const newTab = tabType.create({ title: newTitle }, [paragraph]);

    const insertPos = pos + node.nodeSize - 1;
    const tr = state.tr.insert(insertPos, newTab);

    const newActiveIndex = node.childCount;
    tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      activeTab: newActiveIndex,
    });

    editor.view.dispatch(tr);
  }, [editor, getPos, node]);

  const deleteTab = useCallback(
    (index: number) => {
      if (!editor.isEditable) return;
      const pos = getPos();
      if (pos == null) return;

      if (node.childCount <= 1) {
        const tr = editor.view.state.tr.delete(pos, pos + node.nodeSize);
        editor.view.dispatch(tr);
        return;
      }

      const { state } = editor.view;

      let tabStart = pos + 1;
      for (let i = 0; i < index; i++) {
        tabStart += node.child(i).nodeSize;
      }
      const tabEnd = tabStart + node.child(index).nodeSize;

      const tr = state.tr.delete(tabStart, tabEnd);

      let newActive = activeTab;
      if (index === activeTab) {
        newActive = index >= node.childCount - 1 ? index - 1 : index;
      } else if (index < activeTab) {
        newActive = activeTab - 1;
      }
      newActive = Math.max(0, Math.min(newActive, node.childCount - 2));

      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        activeTab: newActive,
      });

      editor.view.dispatch(tr);
    },
    [editor, getPos, node, activeTab]
  );

  const startRename = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingIndex(index);
      setEditValue(tabs[index]?.title || `Tab ${index + 1}`);
    },
    [tabs]
  );

  const commitRename = useCallback(() => {
    if (editingIndex === null) return;
    const pos = getPos();
    if (pos == null) return;

    const { state } = editor.view;
    const finalTitle = editValue.trim() || `Tab ${editingIndex + 1}`;

    let tabPos = pos + 1;
    for (let i = 0; i < editingIndex; i++) {
      tabPos += node.child(i).nodeSize;
    }

    const tr = state.tr.setNodeMarkup(tabPos, undefined, {
      ...node.child(editingIndex).attrs,
      title: finalTitle,
    });

    editor.view.dispatch(tr);
    setEditingIndex(null);
  }, [editor, editingIndex, editValue, getPos, node]);

  const cancelRename = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitRename();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelRename();
      }
    },
    [commitRename, cancelRename]
  );

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  return (
    <NodeViewWrapper className="tiptap-tabs-wrapper" data-type="tabs">
      <div className="tiptap-tabs-bar" contentEditable={false}>
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={`tiptap-tabs-button ${index === activeTab ? "active" : ""}`}
            onClick={() => switchTab(index)}
            onDoubleClick={(e) => startRename(index, e)}
          >
            {editingIndex === index ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={commitRename}
                className="tiptap-tabs-rename-input"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="tiptap-tabs-title">{tab.title}</span>
            )}

            {editingIndex !== index && (
              <button
                className="tiptap-tabs-icon-btn"
                onClick={(e) => startRename(index, e)}
                title="Rename tab (or double click)"
              >
                <Pencil size={12} />
              </button>
            )}

            <button
              className="tiptap-tabs-icon-btn tiptap-tabs-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteTab(index);
              }}
              title="Delete tab"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <button className="tiptap-tabs-add-btn" onClick={addTab} title="Add tab">
          <Plus size={14} />
        </button>
      </div>

      <div className="tiptap-tabs-content">
        <NodeViewContent className="tiptap-tabs-content-inner" />
      </div>
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tabs: {
      addTabsBlock: () => ReturnType;
    };
  }
}

const Tabs = Node.create({
  name: "tabs",

  group: "block",

  content: "tab+",

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      activeTab: {
        default: 0,
        parseHTML: (element) => {
          const val = element.getAttribute("data-active-tab");
          return val != null ? Number.parseInt(val, 10) : 0;
        },
        renderHTML: (attributes) => ({
          "data-active-tab": attributes.activeTab,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="tabs"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "tabs",
        class: "tiptap-tabs-wrapper",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabsNodeView);
  },

  addProseMirrorPlugins() {
    return [createTabDecorationPlugin()];
  },

  addCommands() {
    return {
      addTabsBlock:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: "tabs",
              attrs: {
                activeTab: 0,
              },
              content: [
                {
                  type: "tab",
                  attrs: {
                    title: "Introduction",
                  },
                  content: [
                    {
                      type: "heading",
                      attrs: { level: 2 },
                      content: [{ type: "text", text: "🚀 Tab Canvas One" }],
                    },
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "You can write full rich text here.",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "tab",
                  attrs: {
                    title: "Resources",
                  },
                  content: [
                    {
                      type: "heading",
                      attrs: { level: 2 },
                      content: [{ type: "text", text: "🔗 Reference Materials" }],
                    },
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Organize related content here.",
                        },
                      ],
                    },
                  ],
                },
              ],
            })
            .run();
        },
    };
  },
});

export default Tabs;
