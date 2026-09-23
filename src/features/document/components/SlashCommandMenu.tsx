"use client";

import { Extension } from "@tiptap/core";
import type { Editor, Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from "@tiptap/suggestion";
import {
  ChevronRight,
  Code2,
  GitFork,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  LayoutPanelTop,
  List,
  ListOrdered,
  ListTodo,
  MessageSquare,
  Minus,
  Quote,
  Sparkles,
  Table as TableIcon,
  Type,
} from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (props: { editor: Editor; range: Range }) => void;
}

const getSuggestionItems = (): SlashCommandItem[] => [
  {
    title: "Text",
    description: "Plain text block",
    icon: <Type className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: <List className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Ordered list",
    icon: <ListOrdered className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "To-do List",
    description: "Checklist with tasks",
    icon: <ListTodo className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Blockquote",
    icon: <Quote className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run();
    },
  },
  {
    title: "Callout",
    description: "Highlighted info or warning block",
    icon: <MessageSquare className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setCallout({ emoji: "💡" }).run();
    },
  },
  {
    title: "Toggle",
    description: "Collapsible content block",
    icon: <ChevronRight className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).insertToggle().run();
    },
  },
  {
    title: "Code Block",
    description: "Syntax-highlighted code",
    icon: <Code2 className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run();
    },
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: <Minus className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Image",
    description: "Embed an image from URL",
    icon: <ImageIcon className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      const url = window.prompt("Enter image URL");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    },
  },
  {
    title: "Table",
    description: "Insert a table",
    icon: <TableIcon className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: "Tabs",
    description: "Tabbed content block",
    icon: <LayoutPanelTop className="slash-cmd-icon" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).addTabsBlock().run();
    },
  },
  {
    title: "Mermaid Diagram",
    description: "Architecture, sequence, or flowcharts",
    icon: <GitFork className="slash-cmd-icon text-primary" />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).insertMermaidBlock().run();
    },
  },
  // AI Assistant feature commented out until fully connected with API credentials:
  // {
  //   title: "AI Assistant",
  //   description: "Draft docs or summarize with Copilot",
  //   icon: <Sparkles className="slash-cmd-icon text-indigo-500" />,
  //   command: ({ editor, range }: { editor: Editor; range: Range }) => {
  //     editor.chain().focus().deleteRange(range).run();
  //     if (typeof window !== "undefined") {
  //       window.dispatchEvent(new CustomEvent("codevault:open-ai-modal"));
  //     }
  //   },
  // },
];

interface CommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface CommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const el = containerRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) command(item);
    },
    [items, command]
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="slash-menu">
        <div className="slash-menu-empty">No results</div>
      </div>
    );
  }

  return (
    <div className="slash-menu" ref={containerRef}>
      {items.map((item, index) => (
        <button
          key={item.title}
          data-index={index}
          className={`slash-menu-item ${index === selectedIndex ? "is-selected" : ""}`}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className="slash-menu-item-icon">{item.icon}</span>
          <span className="slash-menu-item-body">
            <span className="slash-menu-item-title">{item.title}</span>
            <span className="slash-menu-item-desc">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
});

CommandList.displayName = "CommandList";

const renderSuggestion = () => {
  let component: ReactRenderer<CommandListRef> | null = null;
  let popup: HTMLDivElement | null = null;

  return {
    onStart: (props: SuggestionProps<SlashCommandItem>) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      popup = document.createElement("div");
      popup.style.position = "fixed";
      popup.style.zIndex = "9999";
      popup.appendChild(component.element);
      document.body.appendChild(popup);

      updatePosition(props, popup);
    },

    onUpdate(props: SuggestionProps<SlashCommandItem>) {
      component?.updateProps(props);
      if (popup) updatePosition(props, popup);
    },

    onKeyDown(props: SuggestionKeyDownProps) {
      if (props.event.key === "Escape") {
        if (popup) popup.style.display = "none";
        return true;
      }
      return component?.ref?.onKeyDown(props) ?? false;
    },

    onExit() {
      popup?.remove();
      component?.destroy();
      popup = null;
      component = null;
    },
  };
};

function updatePosition(props: SuggestionProps<SlashCommandItem>, popup: HTMLDivElement): void {
  const rect = props.clientRect?.();
  if (!rect) return;

  const OFFSET = 6;
  const MAX_H = 320;
  const spaceBelow = window.innerHeight - rect.bottom;

  const top = spaceBelow >= MAX_H + OFFSET ? rect.bottom + OFFSET : rect.top - MAX_H - OFFSET;

  popup.style.left = `${Math.max(8, rect.left)}px`;
  popup.style.top = `${top}px`;
}

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: SlashCommandItem;
        }) => {
          props.command({ editor, range });
        },
        items: ({ query }: { query: string }) => {
          return getSuggestionItems().filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          );
        },
        render: renderSuggestion,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
