"use client";

import { cn } from "@/lib/utils";
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
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Pencil,
  Quote,
  Strikethrough,
  UnderlineIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface PolicyContentEditorProps {
  value?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-7 w-7 flex items-center justify-center rounded-md text-sm transition-all",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5" />;
}

export function PolicyContentEditor({
  value,
  onChange,
  placeholder = "Write the full policy content here. Use headings, lists, and formatting to structure the document...",
}: PolicyContentEditorProps) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [charCount, setCharCount] = useState(0);

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
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      const isEmpty = html === "<p></p>" || html === "" || e.isEmpty;
      onChange(isEmpty ? "" : html);
      setCharCount(e.storage.characterCount?.characters?.() ?? e.getText().length);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "";
    if (current !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false });
      setCharCount(editor.getText().length);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  const previewHtml = editor?.getHTML() ?? "";

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-2 py-1.5 gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              tab === "edit"
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              tab === "preview"
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
        </div>

        {tab === "edit" && editor && (
          <div className="flex items-center flex-wrap gap-0.5">
            <ToolbarButton
              title="Bold (Ctrl+B)"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Italic (Ctrl+I)"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Underline (Ctrl+U)"
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Strikethrough"
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              title="Heading 1"
              active={editor.isActive("heading", { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 2"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 3"
              active={editor.isActive("heading", { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              title="Bullet List"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Ordered List"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Blockquote"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Code Block"
              active={editor.isActive("codeBlock")}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              <Code2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Inline Code"
              active={editor.isActive("code")}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              title="Align Left"
              active={editor.isActive({ textAlign: "left" })}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Align Center"
              active={editor.isActive({ textAlign: "center" })}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Align Right"
              active={editor.isActive({ textAlign: "right" })}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
            >
              <AlignRight className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              title={editor.isActive("link") ? "Remove Link" : "Add Link"}
              active={editor.isActive("link")}
              onClick={setLink}
            >
              {editor.isActive("link") ? (
                <Link2Off className="h-3.5 w-3.5" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
            </ToolbarButton>
            <ToolbarButton
              title="Horizontal Rule"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus className="h-3.5 w-3.5" />
            </ToolbarButton>
          </div>
        )}
      </div>

      {tab === "edit" ? (
        <div className="relative min-h-75">
          <EditorContent
            editor={editor}
            className="policy-editor min-h-75 px-4 py-3 text-sm text-foreground focus:outline-none"
          />
          <div className="absolute bottom-2 right-3 text-xs text-muted-foreground/60 select-none pointer-events-none tabular-nums">
            {charCount.toLocaleString()} chars
          </div>
        </div>
      ) : (
        <div className="min-h-75 px-4 py-3">
          {previewHtml && previewHtml !== "<p></p>" ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <div className="flex items-center justify-center h-70 text-sm text-muted-foreground/50">
              Nothing to preview yet. Switch to Edit and add some content.
            </div>
          )}
        </div>
      )}

      <style>{`
        .policy-editor .ProseMirror {
          outline: none;
          min-height: 300px;
        }
        .policy-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
          opacity: 0.5;
          font-size: 0.875rem;
        }
        .policy-editor .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .policy-editor .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 0.875rem 0 0.375rem; }
        .policy-editor .ProseMirror h3 { font-size: 1.05rem; font-weight: 600; margin: 0.75rem 0 0.25rem; }
        .policy-editor .ProseMirror ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .policy-editor .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .policy-editor .ProseMirror li { margin: 0.2rem 0; }
        .policy-editor .ProseMirror blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 1rem; margin: 0.75rem 0; color: hsl(var(--muted-foreground)); }
        .policy-editor .ProseMirror pre { background: hsl(var(--muted)); border-radius: 0.375rem; padding: 0.75rem 1rem; font-size: 0.8125rem; margin: 0.75rem 0; overflow-x: auto; }
        .policy-editor .ProseMirror code:not(pre code) { background: hsl(var(--muted)); border-radius: 0.25rem; padding: 0.15rem 0.375rem; font-size: 0.8125rem; }
        .policy-editor .ProseMirror hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 1rem 0; }
        .policy-editor .ProseMirror a { color: hsl(var(--primary)); text-decoration: underline; }
        .policy-editor .ProseMirror strong { font-weight: 700; }
        .policy-editor .ProseMirror em { font-style: italic; }
        .policy-editor .ProseMirror s { text-decoration: line-through; }
      `}</style>
    </div>
  );
}
