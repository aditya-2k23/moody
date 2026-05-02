"use client";

import { Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2 } from "lucide-react";

export default function StyleTools({ editor, className = "" }) {
  if (!editor) return null;

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run();
  const toggleHeading = (level) => editor.chain().focus().toggleHeading({ level }).run();

  return (
    <div className={`flex items-center gap-0.5 sm:gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg border border-indigo-100 dark:border-slate-700/50 shadow-sm z-10 transition-opacity ${className}`}>
      <button
        type="button"
        title="Bold (Ctrl+B)"
        onClick={toggleBold}
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${editor.isActive("bold") ? "text-indigo-600 bg-indigo-50 dark:bg-slate-700" : "text-slate-500 dark:text-slate-300"}`}
      >
        <Bold size={14} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        title="Italic (Ctrl+I)"
        onClick={toggleItalic}
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${editor.isActive("italic") ? "text-indigo-600 bg-indigo-50 dark:bg-slate-700" : "text-slate-500 dark:text-slate-300"}`}
      >
        <Italic size={14} strokeWidth={2.5} />
      </button>
      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
      <button
        type="button"
        title="Heading 1"
        onClick={() => toggleHeading(1)}
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${editor.isActive("heading", { level: 1 }) ? "text-indigo-600 bg-indigo-50 dark:bg-slate-700" : "text-slate-500 dark:text-slate-300"}`}
      >
        <Heading1 size={14} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        title="Heading 2"
        onClick={() => toggleHeading(2)}
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${editor.isActive("heading", { level: 2 }) ? "text-indigo-600 bg-indigo-50 dark:bg-slate-700" : "text-slate-500 dark:text-slate-300"}`}
      >
        <Heading2 size={14} strokeWidth={2.5} />
      </button>
      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
      <button
        type="button"
        title="Bullet List"
        onClick={toggleBulletList}
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${editor.isActive("bulletList") ? "text-indigo-600 bg-indigo-50 dark:bg-slate-700" : "text-slate-500 dark:text-slate-300"}`}
      >
        <List size={14} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        title="Ordered List"
        onClick={toggleOrderedList}
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${editor.isActive("orderedList") ? "text-indigo-600 bg-indigo-50 dark:bg-slate-700" : "text-slate-500 dark:text-slate-300"}`}
      >
        <ListOrdered size={14} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        title="Quote"
        onClick={toggleBlockquote}
        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${editor.isActive("blockquote") ? "text-indigo-600 bg-indigo-50 dark:bg-slate-700" : "text-slate-500 dark:text-slate-300"}`}
      >
        <Quote size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}