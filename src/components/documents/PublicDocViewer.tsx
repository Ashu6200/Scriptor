"use client";

import { cn } from "@/lib/utils";
import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Callout } from "@/features/document/extensions/Callout";
import { MermaidBlock } from "@/features/document/extensions/MermaidBlock";
import Tab from "@/features/document/extensions/Tab";
import Tabs from "@/features/document/extensions/Tabs";
import { Toggle } from "@/features/document/extensions/Toggle";

const viewerExtensions = [
  StarterKit,
  Underline,
  TiptapLink.configure({ openOnClick: true }),
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
];

interface PublicDocViewerProps {
  content: string | null;
  className?: string;
  onHeadingsExtracted?: (headings: Array<{ id: string; text: string; level: number }>) => void;
}

export function PublicDocViewer({
  content,
  className,
  onHeadingsExtracted,
}: PublicDocViewerProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = resolvedTheme === "dark";

  const html = useMemo(() => {
    if (!content) return "";
    try {
      const json = JSON.parse(content);
      return generateHTML(json, viewerExtensions);
    } catch {
      return content;
    }
  }, [content]);

  useEffect(() => {
    if (!containerRef.current) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "neutral",
      securityLevel: "loose",
    });

    const mermaidContainers = containerRef.current.querySelectorAll(
      ".mermaid-block-container"
    );

    mermaidContainers.forEach((el, index) => {
      const pre = el.querySelector(".mermaid-code-hidden");
      const code = pre?.textContent;
      if (code && !el.querySelector(".mermaid-rendered")) {
        const id = `public_mermaid_${index}_${Date.now()}`;
        mermaid
          .render(id, code)
          .then(({ svg }) => {
            const wrapper = document.createElement("div");
            wrapper.className =
              "mermaid-rendered my-6 p-4 rounded-xl border border-border/70 bg-card flex justify-center [&>svg]:max-w-full";
            wrapper.innerHTML = svg;
            el.appendChild(wrapper);
          })
          .catch(() => {
          });
      }
    });

    const headings: Array<{ id: string; text: string; level: number }> = [];
    const headingElements = containerRef.current.querySelectorAll("h1, h2, h3");

    headingElements.forEach((el, index) => {
      const text = el.textContent || "";
      const level = Number.parseInt(el.tagName.replace("H", ""), 10);
      const slug =
        el.id ||
        text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") ||
        `heading-${index}`;
      el.id = slug;
      headings.push({ id: slug, text, level });
    });

    if (onHeadingsExtracted) {
      onHeadingsExtracted(headings);
    }

    const preBlocks = containerRef.current.querySelectorAll("pre");
    for (const pre of preBlocks) {
      if (pre.querySelector(".copy-code-btn") || pre.classList.contains("mermaid-code-hidden")) {
        continue;
      }
      pre.style.position = "relative";
      const btn = document.createElement("button");
      btn.className =
        "copy-code-btn absolute top-2 right-2 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors flex items-center gap-1";
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
      btn.onclick = () => {
        const codeText = pre.querySelector("code")?.innerText || pre.innerText;
        navigator.clipboard.writeText(codeText);
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
        setTimeout(() => {
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
        }, 2000);
      };
      pre.appendChild(btn);
    }
  }, [html, isDark, onHeadingsExtracted]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:font-mono prose-code:text-primary prose-code:bg-muted/70 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/60 prose-pre:p-4 prose-pre:rounded-xl",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
