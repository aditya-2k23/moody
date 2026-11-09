/**
 * __tests__/components/RichTextEditor.test.jsx
 *
 * WHY THIS TEST EXISTS:
 *   After login the saved journal arrives after the editor has mounted, so it is
 *   loaded through the setContent() sync path. With parseOptions.preserveWhitespace
 *   "full", Tiptap 3 sent the content through tiptap-markdown twice and the editor
 *   showed "&lt;p&gt;Happy Diwali Yesterday!&lt;/p&gt;" instead of the entry.
 */

import React from "react";
import { render, waitFor } from "@testing-library/react";
import RichTextEditor from "@/components/RichTextEditor";

const editorText = (container) => container.querySelector(".ProseMirror")?.textContent;

describe("RichTextEditor", () => {
  it("shows a journal entry loaded after mount as text, not escaped HTML", async () => {
    const { container, rerender } = render(<RichTextEditor value="" onChange={() => {}} />);
    await waitFor(() => expect(container.querySelector(".ProseMirror")).not.toBeNull());

    rerender(<RichTextEditor value={"Happy Diwali Yesterday!\n\n- **lights**"} onChange={() => {}} />);

    await waitFor(() => expect(editorText(container)).toContain("Happy Diwali Yesterday!"));
    expect(editorText(container)).not.toMatch(/&lt;|<p>/);
    expect(container.querySelector(".ProseMirror li strong")?.textContent).toBe("lights");
  });
});
