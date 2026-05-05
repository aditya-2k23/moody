"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "tiptap-markdown";
import { useEffect } from "react";

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your thoughts...",
  className = "",
  disabled = false,
  isVoiceInput = false,
  onFocus,
  onBlur,
  onEditorCreated,
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "before:content-[attr(data-placeholder)] before:float-left before:text-slate-400 dark:before:text-slate-500 before:pointer-events-none before:h-0 before:text-sm",
      }),
      Typography,
      Underline,
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: "-",
      }),
    ],
    content: value,
    editable: !disabled,
    onCreate: ({ editor }) => {
      onEditorCreated?.(editor);
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange?.(markdown);
    },
    onFocus,
    onBlur,
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none min-h-full scroll-auto ${className}`,
      },
    },
  });

  // Sync value from parent (e.g. voice input or initial load)
  useEffect(() => {
    if (!editor) return;

    // Get current markdown to compare
    const currentMarkdown = editor.storage.markdown.getMarkdown();

    // Only update if content is actually different and the editor isn't being actively used
    // This prevents "jitter" and cursor jumps during manual typing
    if (value !== currentMarkdown) {
      // If the editor is focused, we only update if the change is likely from an external source
      // (like voice transcript or initial load) rather than manual typing
      const isManualTyping = editor.isFocused;

      if (!isManualTyping || isVoiceInput) {
        editor.commands.setContent(value, false, {
          preserveWhitespace: "full",
        });
      }
    }
  }, [value, editor, isVoiceInput]);

  // Sync disabled state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className="relative w-full min-h-[inherit] cursor-text"
      onClick={() => editor?.commands.focus()}
    >
      <EditorContent editor={editor} className="min-h-[inherit]" />
    </div>
  );
}
