"use client";

import { DragHandle as TiptapDragHandle } from "@tiptap/extension-drag-handle-react";
import type { Editor } from "@tiptap/react";
import { GripVertical } from "lucide-react";

interface DragHandleProps {
  editor: Editor;
}

export function DragHandle({ editor }: DragHandleProps) {
  return (
    <TiptapDragHandle editor={editor} className="drag-handle">
      <GripVertical className="drag-handle-icon" />
    </TiptapDragHandle>
  );
}
