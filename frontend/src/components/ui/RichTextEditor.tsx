"use client";

import React, { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';

// Define the MenuBar component to be used inside the editor
const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 p-2 flex flex-wrap gap-1 sticky top-0 z-10 rounded-t-md">
      {/* Text style buttons */}
      <div className="flex border-r border-gray-200 pr-2 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Bold"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h8a4 4 0 014 4 4 4 0 01-4 4H6z" 
            />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Italic"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 4h-9M14 20H5M14.5 4L9.5 20" 
            />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Underline"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 8h10M7 12h10M7 16h10M7 20h10" 
            />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Strikethrough"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 12h14M9 16h6M9 8h6" 
            />
          </svg>
        </button>
      </div>
      
      {/* Heading buttons */}
      <div className="flex border-r border-gray-200 pr-2 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Heading"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 4v16M18 4v16M6 12h12" 
            />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Subheading"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h8" 
            />
          </svg>
        </button>
      </div>
      
      {/* Text alignment buttons */}
      <div className="flex border-r border-gray-200 pr-2 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Align Left"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h10M4 18h12" 
            />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Align Center"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M7 12h10M6 18h12" 
            />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Align Right"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M10 12h10M8 18h12" 
            />
          </svg>
        </button>
      </div>
      
      {/* List buttons */}
      <div className="flex border-r border-gray-200 pr-2 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Bullet List"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h2M10 6h10M4 12h2M10 12h10M4 18h2M10 18h10" 
            />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Numbered List"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h1M10 6h10M4 12h1M10 12h10M4 18h1M10 18h10" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M4.5 8L5 8M4.5 14L5 14M4.5 20L5 20" 
            />
          </svg>
        </button>
      </div>
      
      {/* Special elements - Removed Link button, keeping only blockquote */}
      <div className="flex border-r border-gray-200 pr-2 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded text-gray-600 hover:bg-gray-100 ${editor.isActive('blockquote') ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Quote"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 8h4M6 12h8M8 16h8" 
            />
          </svg>
        </button>
      </div>
      
      {/* Undo/redo buttons */}
      <div className="flex">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" 
            />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  minHeight?: string;
  content?: string; // For backward compatibility
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = 'Enter content here...',
  required = false,
  className = '',
  minHeight = '200px',
  content, // Support both value and content props
}) => {
  // Use value if provided, otherwise fall back to content
  const editorContent = value || content || '';
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content: editorContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none text-gray-900 font-normal'
      }
    }
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && editorContent !== editor.getHTML()) {
      editor.commands.setContent(editorContent);
    }
  }, [editorContent, editor]);

  // Add CSS for editor content
  useEffect(() => {
    if (editor) {
      // Add a custom CSS class to the editor content
      const element = editor.view.dom as HTMLElement;
      element.classList.add('editor-content');
      
      // Create a style element for custom editor styles
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        .editor-content * {
          color: #111827 !important;
          font-family: ui-sans-serif, system-ui, sans-serif !important;
        }
        .editor-content p {
          color: #111827 !important;
          font-family: ui-sans-serif, system-ui, sans-serif !important;
          margin-bottom: 0.5em;
        }
        .ProseMirror p {
          color: #111827 !important;
          font-family: ui-sans-serif, system-ui, sans-serif !important;
        }
        .ProseMirror {
          color: #111827 !important;
          font-family: ui-sans-serif, system-ui, sans-serif !important;
        }
        .ProseMirror pre {
          background: #f3f4f6;
          padding: 0.75em;
          border-radius: 0.25em;
          font-family: ui-monospace, monospace !important;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1em;
          color: #4b5563 !important;
        }
        .prose, .prose * {
          color: #111827 !important;
        }
        [contenteditable] {
          color: #111827 !important;
        }
      `;
      document.head.appendChild(styleEl);
      
      return () => {
        document.head.removeChild(styleEl);
      };
    }
  }, [editor]);

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`border ${
          error ? 'border-red-300' : 'border-gray-300'
        } rounded-md overflow-hidden bg-white`}
      >
        <MenuBar editor={editor} />
        <EditorContent 
          editor={editor} 
          className="prose prose-sm max-w-none w-full dark:prose-invert focus:outline-none"
          style={{
            minHeight,
            color: '#111827', // text-gray-900 equivalent
          }}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default RichTextEditor; 