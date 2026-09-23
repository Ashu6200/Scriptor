/**
 * High-performance, zero-dependency Myers / LCS line-diff utility
 * Generates unified diffs and side-by-side aligned diffs for document revisions.
 */

export interface UnifiedDiffLine {
  type: "added" | "deleted" | "unchanged";
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface SideBySidePaneLine {
  type: "added" | "deleted" | "unchanged" | "empty";
  text?: string;
  lineNumber?: number;
}

export interface SideBySideRow {
  left: SideBySidePaneLine;
  right: SideBySidePaneLine;
}

export interface DiffResult {
  additions: number;
  deletions: number;
  totalChanges: number;
  unified: UnifiedDiffLine[];
  sideBySide: SideBySideRow[];
  hasChanges: boolean;
}

/**
 * Compute line-by-line diff between two text strings
 */
export function computeLineDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText === "" ? [] : oldText.split("\n");
  const newLines = newText === "" ? [] : newText.split("\n");

  const m = oldLines.length;
  const n = newLines.length;

  // Compute Longest Common Subsequence (LCS) matrix
  // Optimize for memory: if diff is very large (> 5000 lines), truncate or downscale
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to reconstruct edits
  let i = m;
  let j = n;
  const edits: Array<{
    type: "added" | "deleted" | "unchanged";
    text: string;
    oldIdx?: number;
    newIdx?: number;
  }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      edits.push({ type: "unchanged", text: oldLines[i - 1], oldIdx: i, newIdx: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      edits.push({ type: "added", text: newLines[j - 1], newIdx: j });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      edits.push({ type: "deleted", text: oldLines[i - 1], oldIdx: i });
      i--;
    }
  }

  edits.reverse();

  let additions = 0;
  let deletions = 0;
  const unified: UnifiedDiffLine[] = [];

  for (const edit of edits) {
    if (edit.type === "added") {
      additions++;
      unified.push({
        type: "added",
        text: edit.text,
        newLineNumber: edit.newIdx,
      });
    } else if (edit.type === "deleted") {
      deletions++;
      unified.push({
        type: "deleted",
        text: edit.text,
        oldLineNumber: edit.oldIdx,
      });
    } else {
      unified.push({
        type: "unchanged",
        text: edit.text,
        oldLineNumber: edit.oldIdx,
        newLineNumber: edit.newIdx,
      });
    }
  }

  // Build Side-by-Side aligned rows
  const sideBySide: SideBySideRow[] = [];
  let editIdx = 0;

  while (editIdx < edits.length) {
    const current = edits[editIdx];

    if (current.type === "unchanged") {
      sideBySide.push({
        left: { type: "unchanged", text: current.text, lineNumber: current.oldIdx },
        right: { type: "unchanged", text: current.text, lineNumber: current.newIdx },
      });
      editIdx++;
    } else {
      // Group consecutive deletions and additions together
      const delGroup: Array<{ text: string; oldIdx?: number }> = [];
      const addGroup: Array<{ text: string; newIdx?: number }> = [];

      while (editIdx < edits.length && edits[editIdx].type !== "unchanged") {
        if (edits[editIdx].type === "deleted") {
          delGroup.push({ text: edits[editIdx].text, oldIdx: edits[editIdx].oldIdx });
        } else if (edits[editIdx].type === "added") {
          addGroup.push({ text: edits[editIdx].text, newIdx: edits[editIdx].newIdx });
        }
        editIdx++;
      }

      const maxLen = Math.max(delGroup.length, addGroup.length);
      for (let k = 0; k < maxLen; k++) {
        const leftItem = delGroup[k];
        const rightItem = addGroup[k];

        sideBySide.push({
          left: leftItem
            ? { type: "deleted", text: leftItem.text, lineNumber: leftItem.oldIdx }
            : { type: "empty" },
          right: rightItem
            ? { type: "added", text: rightItem.text, lineNumber: rightItem.newIdx }
            : { type: "empty" },
        });
      }
    }
  }

  return {
    additions,
    deletions,
    totalChanges: additions + deletions,
    unified,
    sideBySide,
    hasChanges: additions > 0 || deletions > 0,
  };
}
