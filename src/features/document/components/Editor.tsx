"use client";

import type { JSONContent } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, type Editor as TiptapEditor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import { Callout } from "../extensions/Callout";
import { MermaidBlock } from "../extensions/MermaidBlock";
import Tab from "../extensions/Tab";
import Tabs from "../extensions/Tabs";
import { Toggle } from "../extensions/Toggle";
import { BubbleToolbar } from "./BubbleToolbar";
import { DragHandle } from "./DragHandle";
import { SlashCommand } from "./SlashCommandMenu";

interface EditorProps {
  initialContent?: string | null;
  onSave?: (content: string) => void;
  onEditorReady?: (editor: TiptapEditor) => void;
}

function parseContent(raw?: string | null): JSONContent | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as JSONContent;
  } catch {
    return undefined;
  }
}

export function Editor({ initialContent, onSave, onEditorReady }: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        dropcursor: { color: "var(--ring)", width: 2 },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Tabs,
      Tab,
      Callout,
      Toggle,
      MermaidBlock,
      SlashCommand,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            const level = node.attrs.level as number;
            return `Heading ${level}`;
          }
          return "Type '/' for commands...";
        },
        includeChildren: true,
      }),
    ],
    content: parseContent(initialContent),
    onUpdate: ({ editor: e }) => {
      const json = e.getJSON();
      if (onSave) onSave(JSON.stringify(json));
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  return (
    <div className="notion-editor">
      {editor && <BubbleToolbar editor={editor} />}
      {editor && <DragHandle editor={editor} />}
      <div className="notion-editor-scroll">
        <div className="notion-editor-content">
          <EditorContent editor={editor} className="notion-editable" />
        </div>
      </div>
    </div>
  );
}
