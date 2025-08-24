'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

interface TipTapEditorProps {
  content?: any
  onUpdate?: (json: any) => void
  placeholder?: string
  className?: string
}

export default function TipTapEditor({ 
  content, 
  onUpdate, 
  placeholder = 'Write notes… Use @ to cite, $…$ for math.',
  className = ''
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ 
        placeholder,
        emptyEditorClass: 'is-editor-empty'
      })
    ],
    content: content ?? { 
      type: 'doc', 
      content: [{ type: 'paragraph' }] 
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4'
      }
    }
  })

  if (!editor) {
    return null
  }

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      <div className="border-b border-gray-200 p-2 bg-gray-50">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`px-2 py-1 text-sm rounded ${
              editor.isActive('bold') 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-gray-200'
            }`}
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`px-2 py-1 text-sm rounded ${
              editor.isActive('italic') 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-gray-200'
            }`}
          >
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`px-2 py-1 text-sm rounded ${
              editor.isActive('strike') 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-gray-200'
            }`}
          >
            Strike
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={`px-2 py-1 text-sm rounded ${
              editor.isActive('code') 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-gray-200'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 text-sm rounded ${
              editor.isActive('heading', { level: 1 }) 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-gray-200'
            }`}
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 text-sm rounded ${
              editor.isActive('heading', { level: 2 }) 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-gray-200'
            }`}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 text-sm rounded ${
              editor.isActive('bulletList') 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-gray-200'
            }`}
          >
            List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 text-sm rounded ${
              editor.isActive('orderedList') 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-gray-200'
            }`}
          >
            Ordered List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-2 py-1 text-sm rounded ${
              editor.isActive('blockquote') 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-gray-200'
            }`}
          >
            Quote
          </button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
