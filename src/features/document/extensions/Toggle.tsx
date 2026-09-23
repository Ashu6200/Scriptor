"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggle: {
      insertToggle: (summary?: string) => ReturnType;
    };
  }
}

function ToggleView({ node, updateAttributes }: NodeViewProps) {
  const [open, setOpen] = useState<boolean>(Boolean(node.attrs.open));

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    updateAttributes({ open: next });
  };

  return (
    <NodeViewWrapper className="toggle-block">
      <div className="toggle-summary" contentEditable={false} onClick={handleToggle}>
        <ChevronRight
          className={`toggle-chevron${open ? " toggle-chevron--open" : ""}`}
          size={16}
        />
        <span className="toggle-title">{String(node.attrs.summary ?? "Toggle")}</span>
      </div>
      {open && (
        <div className="toggle-content">
          <NodeViewContent />
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const Toggle = Node.create({
  name: "toggle",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      summary: {
        default: "Click to expand",
        parseHTML: (el) => el.querySelector(".toggle-title")?.textContent ?? "Toggle",
        renderHTML: () => ({}),
      },
      open: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-open") === "true",
        renderHTML: (attrs) => ({ "data-open": String(attrs.open) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="toggle"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "toggle", class: "toggle-block" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleView);
  },

  addCommands() {
    return {
      insertToggle:
        (summary = "Click to expand") =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { summary, open: true },
            content: [{ type: "paragraph" }],
          }),
    };
  },
});
