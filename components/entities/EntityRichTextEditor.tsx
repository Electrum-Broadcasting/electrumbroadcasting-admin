"use client";

import React from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";

interface EntityRichTextEditorProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  citySlug: string;
  slug: string;
}

export default function EntityRichTextEditor({
  label,
  value,
  onChange,
  citySlug,
  slug,
}: EntityRichTextEditorProps) {
  const supabase = createBrowserClient();

const editor = useEditor({
  extensions: [
    StarterKit,
    Image,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
  ],
});

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const ext = file.name.split(".").pop();
    const filename = `richtext-${Date.now()}.${ext}`;
    const path = `${citySlug}/entities/${slug}/richtext/${filename}`;

    const { error } = await supabase.storage
      .from("entity-media")
      .upload(path, file, { upsert: true });

    if (error) {
      alert("Image upload failed.");
      return;
    }

    const { data } = supabase.storage
      .from("entity-media")
      .getPublicUrl(path);

    editor.chain().focus().setImage({ src: data.publicUrl }).run();
  }

  if (!editor) return null;

  return (
    <section className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm border rounded ${
            editor.isActive("bold") ? "bg-gray-200" : ""
          }`}
        >
          Bold
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm border rounded ${
            editor.isActive("italic") ? "bg-gray-200" : ""
          }`}
        >
          Italic
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm border rounded ${
            editor.isActive("bulletList") ? "bg-gray-200" : ""
          }`}
        >
          Bullet List
        </button>

        <button onClick={() => editor.chain().focus().setTextAlign("left").run()}>
  Left
</button>

<button onClick={() => editor.chain().focus().setTextAlign("center").run()}>
  Center
</button>

<button onClick={() => editor.chain().focus().setTextAlign("right").run()}>
  Right
</button>

<button onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
  Justify
</button>

        <label className="px-2 py-1 text-sm border rounded cursor-pointer">
          Insert Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
      </div>

      {/* Editor */}
      <div className="border rounded p-2 min-h-[160px]">
        <EditorContent editor={editor} />
      </div>
    </section>
  );
}
