"use client";

import { Bold, Italic, Underline, List, ListOrdered, Quote, Heading1, Heading2 } from "lucide-react";

const MenuButton = ({ onClick, isActive, icon: Icon, title }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={isActive}
    onClick={onClick}
    className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-100/60 dark:hover:bg-slate-700/60 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 outline-none transition-all ${isActive ? "text-indigo-500 dark:text-slate-100 bg-indigo-100/70 dark:bg-slate-700" : "text-slate-500 dark:text-slate-400/70"}`}
  >
    <Icon size={14} strokeWidth={2.5} />
  </button>
);

const Separator = () => <div className="w-px h-5 bg-slate-400/70 dark:bg-slate-700 mx-0.5" />;

export default function StyleTools({ editor, className = "" }) {
  if (!editor) return null;

  return (
    <div className={`flex items-center gap-0.5 sm:gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm py-1 px-1.5 rounded-lg border border-indigo-100 dark:border-slate-700/50 shadow-[0_0_20px_rgba(99,102,241,0.2)] dark:shadow-[0_0_25px_rgba(99,102,241,0.1)] z-10 transition-opacity ${className}`}>
      <MenuButton
        title="Bold (Ctrl+B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        icon={Bold}
      />
      <MenuButton
        title="Italic (Ctrl+I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        icon={Italic}
      />
      <MenuButton
        title="Underline (Ctrl+U)"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        icon={Underline}
      />

      <Separator />

      <MenuButton
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        icon={Heading1}
      />
      <MenuButton
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        icon={Heading2}
      />

      <Separator />

      <MenuButton
        title="Bullet List"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        icon={List}
      />
      <MenuButton
        title="Ordered List"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        icon={ListOrdered}
      />
      <MenuButton
        title="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        icon={Quote}
      />
    </div>
  );
}
