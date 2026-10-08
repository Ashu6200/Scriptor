import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface OfflineDocument {
  id: string;
  title: string;
  updateMode: "auto" | "manual";
  updateInterval?: string;
  slo?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentState {
  offlineDocs: Record<string, OfflineDocument>;
}

const initialState: DocumentState = {
  offlineDocs: {},
};

export const documentSlice = createSlice({
  name: "document",
  initialState,
  reducers: {
    saveOfflineDocument: (state, action: PayloadAction<OfflineDocument>) => {
      const existing = state.offlineDocs[action.payload.id];
      state.offlineDocs[action.payload.id] = {
        ...action.payload,
        content: action.payload.content ?? existing?.content ?? "",
      };
    },
    updateOfflineDocumentContent: (
      state,
      action: PayloadAction<{ id: string; content: string }>
    ) => {
      const doc = state.offlineDocs[action.payload.id];
      if (doc) {
        doc.content = action.payload.content;
        doc.updatedAt = new Date().toISOString();
      } else {
        state.offlineDocs[action.payload.id] = {
          id: action.payload.id,
          title: "Untitled Document",
          updateMode: "manual",
          content: action.payload.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    },
    removeOfflineDocument: (state, action: PayloadAction<string>) => {
      delete state.offlineDocs[action.payload];
    },
  },
});

export const { saveOfflineDocument, updateOfflineDocumentContent, removeOfflineDocument } =
  documentSlice.actions;

export default documentSlice.reducer;
