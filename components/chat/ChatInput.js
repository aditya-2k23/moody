"use client";

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { Send, Loader2, Type } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import Placeholder from "@tiptap/extension-placeholder";
import VoiceButton from "./VoiceButton";
import StyleTools from "@/components/StyleTools";
import { useVoiceInput } from "@/hooks/useVoiceInput";

/**
 * ChatInput — Tiptap-based chat input with markdown support, voice button,
 * Enter to send, Shift+Enter for newline, and conditional StyleTools
 */
const ChatInput = forwardRef(function ChatInput({
  input,
  setInput,
  onSend,
  isTyping,
  isFullscreen,
}, ref) {
  const [isComposing, setIsComposing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showStyleTools, setShowStyleTools] = useState(false);

  // Initialize Tiptap editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        hardBreak: false,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
      }),
      Placeholder.configure({
        placeholder: "Message Lumi...",
      }),
    ],
    content: input,
    editorProps: {
      handleKeyDown(view, event) {
        // Enter sends message
        if (event.key === "Enter" && !event.shiftKey && !isComposing) {
          event.preventDefault();
          handleSubmit();
          return true;
        }
        // Shift+Enter creates newline
        if (event.key === "Enter" && event.shiftKey) {
          return false;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      const markdown = e.storage.markdown.getMarkdown();
      setInput(markdown);
    },
  });

  // Track mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useImperativeHandle(ref, () => ({
    focus: () => {
      editor?.commands.focus();
    },
  }), [editor]);

  // Voice input integration
  const { isListening, toggleVoiceInput, stopVoiceInput, syncBaseEntry, getDisplayValue } =
    useVoiceInput({
      initialValue: input,
      onTranscriptChange: (newText) => {
        setInput(newText);
        if (editor) {
          editor.commands.setContent(newText);
        }
      },
    });

  const displayValue = getDisplayValue(input);

  useEffect(() => {
    if (editor && isListening) {
      if (displayValue !== editor.storage.markdown.getMarkdown()) {
        editor.commands.setContent(displayValue, false);
      }
    }
  }, [displayValue, editor, isListening]);

  useEffect(() => {
    if (isFullscreen) {
      setTimeout(() => editor?.commands.focus(), 300);
    }
  }, [isFullscreen, editor]);

  const handleSubmit = () => {
    if (isTyping || !editor) return;

    let finalInput = editor.storage.markdown.getMarkdown();
    if (isListening) {
      stopVoiceInput();
      // grab latest after stop
      finalInput = editor.storage.markdown.getMarkdown();
    }

    const trimmed = finalInput.trim();
    if (!trimmed) return;

    onSend(trimmed);

    setInput("");
    editor.commands.clearContent();
  };

  return (
    <div className="p-4 bg-transparent backdrop-blur-md border-t border-gray-100/50 dark:border-white/5">
      {/* StyleTools in document flow when fullscreen */}
      {!isMobile && isFullscreen && editor && showStyleTools && (
        <div className="mb-3 flex justify-start pl-2">
          <StyleTools editor={editor} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex"
      >
        <div className="flex-1 relative">
          {/* StyleTools floating when not fullscreen */}
          {!isMobile && !isFullscreen && editor && showStyleTools && (
            <div className="absolute -top-[3.25rem] left-2 z-20">
              <StyleTools editor={editor} />
            </div>
          )}

          <div className="flex-1 flex items-start bg-slate-50 dark:bg-[#1f233b] rounded-[2rem] border border-indigo-100/50 dark:border-[#333857] focus-within:border-indigo-300 dark:focus-within:border-[#4f5682] focus-within:bg-white dark:focus-within:bg-[#252945] focus-within:shadow-[0_0_15px_rgba(79,70,229,0.1)] transition-all overflow-hidden relative shadow-sm">
            <div
              className={`flex-1 flex max-h-[160px] overflow-y-auto chat-scrollbar tiptap-chat-editor`}
              onClick={() => editor?.commands.focus()}
            >
              <EditorContent
                editor={editor}
                className="flex-1 w-full pl-5 pr-2 py-3 min-h-[48px] text-[15px] focus:outline-none dark:text-gray-200 resize-none leading-relaxed flex flex-col justify-center border-0 prose-p:!my-0"
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
              />
            </div>

            <div className="flex items-center gap-2 pr-3 py-1.5 shrink-0 self-end mb-0.5">
              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setShowStyleTools((prev) => !prev)}
                  className={`h-9 w-9 flex items-center justify-center rounded-full transition-colors ${showStyleTools ? "text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/40" : "text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:text-slate-400/80 dark:hover:bg-slate-800"}`}
                  aria-label="Toggle styling tools"
                  title="Formatting tools"
                >
                  <Type size={16} strokeWidth={2.5} />
                </button>
              )}
              <VoiceButton
                isListening={isListening}
                onToggle={() => toggleVoiceInput(input)}
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input?.trim() || isTyping}
                className="h-9 w-9 text-indigo-500 dark:text-gray-400 disabled:text-gray-400 dark:disabled:text-[#4b5175] flex items-center justify-center transition-all bg-[#eef2ff] dark:bg-[#2f3555] hover:bg-indigo-100 dark:hover:bg-[#3b4267] disabled:bg-gray-100 dark:disabled:bg-[#262b45] disabled:cursor-not-allowed group rounded-full"
                aria-label={isTyping ? "Waiting for response" : "Send message"}
              >
                {isTyping ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} className="ml-0.5" />
                )}
              </button>
            </div>

            {/* Listening indicator bar */}
            {isListening && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-400 via-red-500 to-red-400 animate-pulse" />
            )}
          </div>
        </div>
      </form>
    </div>
  );
});

export default ChatInput;