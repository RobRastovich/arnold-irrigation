'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useRef } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary-600 underline' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href
    const url = window.prompt('URL', prev)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const handleImageUpload = async (file: File) => {
    if (!editor) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/pages/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      })
      if (!res.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, publicUrl } = await res.json()

      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      editor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run()
    } catch (err) {
      console.error('Image upload failed:', err)
      alert('Image upload failed. Please try again.')
    }
  }

  if (!editor) return null

  const toolbarBtn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-1.5 rounded text-sm font-medium transition ${
        active ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1 items-center">
        {toolbarBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold', <strong>B</strong>)}
        {toolbarBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic', <em>I</em>)}
        {toolbarBtn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Underline', <span className="underline">U</span>)}
        {toolbarBtn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'Strikethrough', <span className="line-through">S</span>)}

        <span className="w-px h-6 bg-gray-300 mx-1" />

        {toolbarBtn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'Heading 1', 'H1')}
        {toolbarBtn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading 2', 'H2')}
        {toolbarBtn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Heading 3', 'H3')}

        <span className="w-px h-6 bg-gray-300 mx-1" />

        {toolbarBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet List', '• List')}
        {toolbarBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Ordered List', '1. List')}
        {toolbarBtn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Blockquote', '" "')}

        <span className="w-px h-6 bg-gray-300 mx-1" />

        {toolbarBtn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), 'Align Left', '⬤ Left')}
        {toolbarBtn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), 'Align Center', '⬤ Center')}
        {toolbarBtn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), 'Align Right', '⬤ Right')}

        <span className="w-px h-6 bg-gray-300 mx-1" />

        {toolbarBtn(editor.isActive('link'), setLink, 'Insert Link', '🔗')}
        <button
          type="button"
          title="Insert Image"
          onClick={() => fileInputRef.current?.click()}
          className="px-2 py-1.5 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
        >
          🖼️
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file)
            e.target.value = ''
          }}
        />

        <span className="w-px h-6 bg-gray-300 mx-1" />

        {toolbarBtn(false, () => editor.chain().focus().undo().run(), 'Undo', '↩')}
        {toolbarBtn(false, () => editor.chain().focus().redo().run(), 'Redo', '↪')}
      </div>

      {/* Editor area */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
