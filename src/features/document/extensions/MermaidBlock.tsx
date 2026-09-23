"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import React, { useEffect, useId, useMemo, useState } from "react";
import { useGetProfileQuery } from "@/features/user/api";
import { getPlanEntitlements } from "@/lib/client-entitlements";
import {
  Check,
  Code2,
  Copy,
  Eye,
  GitFork,
  Lock,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mermaidBlock: {
      insertMermaidBlock: (code?: string) => ReturnType;
    };
  }
}

const DEFAULT_MERMAID_CODE = `graph TD
  Client[Web Client] -->|HTTPS Request| API[Next.js API Gateway]
  API -->|Read / Write| DB[(MongoDB Atlas)]
  API -->|Rate Limit & Cache| Cache[(Upstash Redis)]
  API -->|Async Events| Webhooks[Webhook Dispatcher]`;

const DIAGRAM_TEMPLATES: Record<string, { label: string; code: string }> = {
  flowchart: {
    label: "Flowchart",
    code: `graph TD
  Start([Start]) --> Step1[Validate Input]
  Step1 --> Decision{Is Valid?}
  Decision -->|Yes| Process[Process Request]
  Decision -->|No| Error[Return 400 Bad Request]
  Process --> End([Success])`,
  },
  sequence: {
    label: "Sequence",
    code: `sequenceDiagram
  autonumber
  actor User
  participant Frontend as Web Client
  participant Server as Next.js API
  participant DB as MongoDB

  User->>Frontend: Click "Save Document"
  Frontend->>Server: PUT /api/workspaces/.../documents/:id
  Server->>DB: Update & create version snapshot
  DB-->>Server: Acknowledged
  Server-->>Frontend: 200 OK (Envelope)
  Frontend-->>User: Show "Saved" toast`,
  },
  architecture: {
    label: "Architecture",
    code: `graph LR
  subgraph Client Layer
    Browser[Desktop / Mobile]
  end

  subgraph Application Layer
    API[Next.js App Router]
    Auth[Better Auth]
  end

  subgraph Data Layer
    Mongo[(MongoDB Primary)]
    Redis[(Upstash Redis Cache)]
  end

  Browser --> API
  API --> Auth
  API --> Mongo
  API --> Redis`,
  },
  gitgraph: {
    label: "Git Graph",
    code: `gitGraph
  commit id: "Initial Commit"
  branch feature/ai-assistant
  checkout feature/ai-assistant
  commit id: "feat: add AI Copilot route"
  commit id: "feat: TipTap AI modal"
  checkout main
  merge feature/ai-assistant id: "Merge PR #42"
  commit id: "Release v2.1.0" tag: "v2.1.0"`,
  },
};

function MermaidComponent({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { resolvedTheme } = useTheme();
  const rawCode = (node.attrs.code as string) || DEFAULT_MERMAID_CODE;
  const [code, setCode] = useState<string>(rawCode);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const uniqueId = useId().replace(/:/g, "_");
  const { data: profile } = useGetProfileQuery();
  const isAdmin = profile?.platformRole === "ADMIN";
  const planLimits = getPlanEntitlements(profile?.subscriptionPlan, isAdmin);
  const isMermaidGated = !planLimits.hasMermaid;

  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (isMermaidGated) return;
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "neutral",
      securityLevel: "loose",
      fontFamily: "var(--font-sans, inherit)",
      themeVariables: {
        darkMode: isDark,
        background: isDark ? "#18181b" : "#ffffff",
        primaryColor: isDark ? "#3b82f6" : "#2563eb",
        primaryTextColor: isDark ? "#f4f4f5" : "#18181b",
        primaryBorderColor: isDark ? "#3f3f46" : "#cbd5e1",
        lineColor: isDark ? "#71717a" : "#64748b",
      },
    });

    let isMounted = true;

    async function renderDiagram() {
      try {
        setError(null);
        const containerId = `mermaid_${uniqueId}_${Date.now()}`;
        const { svg } = await mermaid.render(containerId, code);
        if (isMounted) {
          setSvgHtml(svg);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Syntax error in Mermaid diagram";
          setError(message);
          setSvgHtml("");
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code, isDark, uniqueId, isMermaidGated]);

  if (isMermaidGated) {
    return (
      <NodeViewWrapper className="mermaid-block my-6 not-prose">
        <div className="rounded-xl border border-dashed border-border/80 bg-card/60 p-6 flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-2.5 rounded-full bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
            <GitFork className="h-3.5 w-3.5 text-primary" /> Interactive Mermaid.js Diagrams
          </div>
          <p className="text-[11px] text-muted-foreground max-w-sm">
            Interactive architecture diagrams and flowcharts are available on Pro and Max plans.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/dashboard/billing";
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Zap className="h-3.5 w-3.5" /> Upgrade to Pro
            </button>
            <button
              type="button"
              onClick={deleteNode}
              className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              Remove Block
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    updateAttributes({ code: newCode });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="mermaid-block my-6 not-prose">
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs transition-all">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-foreground/80 font-mono text-[11px] uppercase tracking-wider">
              <GitFork className="h-3.5 w-3.5 text-primary" /> Mermaid Diagram
            </span>

            {/* Template selector */}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && DIAGRAM_TEMPLATES[e.target.value]) {
                  handleCodeChange(DIAGRAM_TEMPLATES[e.target.value].code);
                }
              }}
              className="text-[11px] bg-background border border-border/60 rounded px-1.5 py-0.5 text-muted-foreground outline-none hover:text-foreground"
            >
              <option value="" disabled>
                Preset Templates...
              </option>
              {Object.entries(DIAGRAM_TEMPLATES).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Copy Mermaid Code"
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                isEditing
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {isEditing ? (
                <>
                  <Eye className="h-3 w-3" /> Preview
                </>
              ) : (
                <>
                  <Code2 className="h-3 w-3" /> Edit Code
                </>
              )}
            </button>

            <button
              type="button"
              onClick={deleteNode}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete Diagram"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Editor Code Area */}
        {isEditing && (
          <div className="p-3 bg-muted/20 border-b border-border/40 font-mono text-xs">
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full bg-background border border-border/60 rounded-lg p-2.5 text-foreground font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              placeholder="Enter Mermaid diagram code..."
            />
          </div>
        )}

        {/* Diagram Display Area */}
        <div className="p-6 flex flex-col items-center justify-center min-h-40 bg-background/50 overflow-x-auto">
          {error ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs max-w-lg text-center space-y-1">
              <p className="font-semibold">Failed to render Mermaid diagram</p>
              <p className="text-[11px] opacity-80 font-mono">{error}</p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-2 text-xs font-semibold underline hover:opacity-90 inline-block"
              >
                Click here to edit and fix syntax
              </button>
            </div>
          ) : svgHtml ? (
            <div
              className="mermaid-svg-container max-w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Rendering diagram...</span>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const MermaidBlock = Node.create({
  name: "mermaidBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      code: {
        default: DEFAULT_MERMAID_CODE,
        parseHTML: (el) => el.getAttribute("data-code") ?? DEFAULT_MERMAID_CODE,
        renderHTML: (attrs) => ({
          "data-code": String(attrs.code),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mermaid-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "mermaid-block",
        class: "mermaid-block-container",
      }),
      ["pre", { class: "mermaid-code-hidden" }, String(HTMLAttributes["data-code"] || "")],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidComponent);
  },

  addCommands() {
    return {
      insertMermaidBlock:
        (code) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { code: code || DEFAULT_MERMAID_CODE },
          }),
    };
  },
});
