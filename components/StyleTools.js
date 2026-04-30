"use client";

import { useEffect } from "react";
import { Bold, Italic, List } from "lucide-react";

export default function StyleTools({ textareaRef }) {
  const insertMarkdown = (prefix, suffix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end, text.length);

    const newText = `${before}${prefix}${selected}${suffix}${after}`;

    // Update value natively so React triggers onChange properly
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    ).set;
    nativeInputValueSetter.call(textarea, newText);

    const event = new Event("input", { bubbles: true });
    textarea.dispatchEvent(event);

    // Restore cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e) => {
      // Ctrl+B or Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        insertMarkdown("**", "**");
      }
      // Ctrl+I or Cmd+I
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        insertMarkdown("*", "*");
      }
      // Ctrl+L or Cmd+L for list - optional but handy
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        insertMarkdown("- ", "");
      }
    };

    textarea.addEventListener("keydown", handleKeyDown);
    return () => {
      textarea.removeEventListener("keydown", handleKeyDown);
    };
  }, [textareaRef]);

  return (
    <div className="absolute top-2 right-2 hidden md:flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg border border-indigo-100 dark:border-slate-700/50 shadow-sm z-10 transition-opacity">
      <button
        type="button"
        title="Bold (Ctrl+B)"
        onClick={() => insertMarkdown("**", "**")}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <Bold size={14} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        title="Italic (Ctrl+I)"
        onClick={() => insertMarkdown("*", "*")}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <Italic size={14} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        title="Bullet List (Ctrl+L)"
        onClick={() => insertMarkdown("- ", "")}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <List size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}