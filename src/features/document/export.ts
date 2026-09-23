/**
 * Client-side document export utilities.
 * All conversions happen in the browser — no server round-trip needed.
 */

type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

function nodeToMarkdown(node: TipTapNode, depth = 0): string {
  if (!node) return "";
  const children = (node.content ?? []).map((c) => nodeToMarkdown(c, depth)).join("");

  switch (node.type) {
    case "doc":
      return children.trim();
    case "paragraph":
      return children ? `\n\n${children}` : "";
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      return `\n\n${"#".repeat(level)} ${children}`;
    }
    case "bulletList":
      return `\n${children}`;
    case "orderedList":
      return `\n${children}`;
    case "listItem":
      return `\n${"  ".repeat(depth)}- ${children.trimStart()}`;
    case "blockquote":
      return `\n\n> ${children.trim()}`;
    case "codeBlock": {
      const lang = (node.attrs?.language as string) ?? "";
      return `\n\n\`\`\`${lang}\n${children}\n\`\`\``;
    }
    case "horizontalRule":
      return "\n\n---";
    case "hardBreak":
      return "  \n";
    case "text": {
      let text = node.text ?? "";
      const marks = node.marks ?? [];
      for (const mark of marks) {
        if (mark.type === "bold") text = `**${text}**`;
        else if (mark.type === "italic") text = `_${text}_`;
        else if (mark.type === "code") text = `\`${text}\``;
        else if (mark.type === "strike") text = `~~${text}~~`;
        else if (mark.type === "link") {
          const href = (mark.attrs?.href as string) ?? "#";
          text = `[${text}](${href})`;
        }
      }
      return text;
    }
    default:
      return children;
  }
}

export function tiptapToMarkdown(jsonContent: string): string {
  try {
    const doc = JSON.parse(jsonContent) as TipTapNode;
    return nodeToMarkdown(doc).trim();
  } catch {
    return jsonContent;
  }
}

export function tiptapToPlainText(jsonContent: string): string {
  try {
    const doc = JSON.parse(jsonContent) as TipTapNode;
    const extractText = (node: TipTapNode): string => {
      if (node.type === "text") return node.text ?? "";
      if (node.type === "hardBreak") return "\n";
      return (node.content ?? [])
        .map(extractText)
        .join(node.type === "paragraph" || node.type?.includes("Heading") ? "\n" : "");
    };
    return extractText(doc).trim();
  } catch {
    return jsonContent;
  }
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
