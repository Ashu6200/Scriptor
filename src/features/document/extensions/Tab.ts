import { Node, mergeAttributes } from "@tiptap/core";

const Tab = Node.create({
  name: "tab",

  content: "block+",

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      title: {
        default: "Tab 1",
        parseHTML: (element) => element.getAttribute("data-title") || "Tab 1",
        renderHTML: (attributes) => ({
          "data-title": attributes.title,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="tab"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "tab",
        class: "tiptap-tab",
      }),
      0,
    ];
  },
});

export default Tab;
