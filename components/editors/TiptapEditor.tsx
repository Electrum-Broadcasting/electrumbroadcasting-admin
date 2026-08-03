"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

type Props = {
  content: string;
  onUpdate: (html: string) => void;
  onInsert360?: (url: string) => void;
};

export default function TiptapEditor({ content, onUpdate, onInsert360 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: true }),
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  if (!editor) return null;

  function promptForLink() {
    const url = window.prompt("Enter URL:");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }

  function insert360(url: string) {
    editor.chain().focus().setImage({ src: url }).run();
    onInsert360?.(url);
  }

  return (
    <div className="border rounded p-2 space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {/* Text style */}
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          Strike
        </button>

        {/* Headings */}
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </button>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>

        {/* Lists */}
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </button>

        {/* Block elements */}
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </button>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          Code
        </button>

        {/* Links */}
        <button
          className="px-2 py-1 border rounded"
          onClick={promptForLink}
        >
          Link
        </button>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          Unlink
        </button>

        {/* 360° media */}
        <button
          className="px-2 py-1 border rounded"
          onClick={() => {
            const url = window.prompt("Enter 360° image URL:");
            if (url) insert360(url);
          }}
        >
          Insert 360°
        </button>

        {/* Undo / Redo */}
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo
        </button>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
