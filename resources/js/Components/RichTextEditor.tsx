import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    minHeight?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) return null;

    const buttonClass = (isActive: boolean) =>
        `p-1.5 rounded-lg transition-colors ${
            isActive
                ? 'bg-violet-100 text-violet-700'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`;

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-slate-50 rounded-t-xl">
            {/* Text Formatting */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={buttonClass(editor.isActive('bold'))}
                    title="Bold"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={buttonClass(editor.isActive('italic'))}
                    title="Italic"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0v16m4-16h-4" transform="skewX(-10)" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={buttonClass(editor.isActive('underline'))}
                    title="Underline"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v7a5 5 0 0010 0V4M5 20h14" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={buttonClass(editor.isActive('strike'))}
                    title="Strikethrough"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M6 6h4a4 4 0 014 4M10 18h4a4 4 0 004-4" />
                    </svg>
                </button>
            </div>

            {/* Headings */}
            <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={buttonClass(editor.isActive('heading', { level: 2 }))}
                    title="Heading 2"
                >
                    <span className="text-xs font-bold">H2</span>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={buttonClass(editor.isActive('heading', { level: 3 }))}
                    title="Heading 3"
                >
                    <span className="text-xs font-bold">H3</span>
                </button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={buttonClass(editor.isActive('bulletList'))}
                    title="Bullet List"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        <circle cx="2" cy="6" r="1" fill="currentColor" />
                        <circle cx="2" cy="12" r="1" fill="currentColor" />
                        <circle cx="2" cy="18" r="1" fill="currentColor" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={buttonClass(editor.isActive('orderedList'))}
                    title="Numbered List"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13" />
                        <text x="2" y="8" fontSize="6" fill="currentColor">1</text>
                        <text x="2" y="14" fontSize="6" fill="currentColor">2</text>
                        <text x="2" y="20" fontSize="6" fill="currentColor">3</text>
                    </svg>
                </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={buttonClass(editor.isActive({ textAlign: 'left' }))}
                    title="Align Left"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={buttonClass(editor.isActive({ textAlign: 'center' }))}
                    title="Align Center"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={buttonClass(editor.isActive({ textAlign: 'right' }))}
                    title="Align Right"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                    </svg>
                </button>
            </div>

            {/* Link */}
            <div className="flex items-center gap-0.5 px-2">
                <button
                    type="button"
                    onClick={() => {
                        const url = window.prompt('Enter URL:');
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                        }
                    }}
                    className={buttonClass(editor.isActive('link'))}
                    title="Add Link"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                </button>
                {editor.isActive('link') && (
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().unsetLink().run()}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        title="Remove Link"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-0.5 pl-2 ml-auto">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Undo"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Redo"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default function RichTextEditor({
    content,
    onChange,
    placeholder = 'Start typing...',
    label,
    error,
    minHeight = '200px',
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-violet-600 underline hover:text-violet-800',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Underline,
        ],
        content,
        editorProps: {
            attributes: {
                class: `prose prose-sm max-w-none px-4 py-3 focus:outline-none`,
                style: `min-height: ${minHeight}`,
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Update editor content when external content changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {label}
                </label>
            )}
            <div
                className={`
                    border rounded-xl overflow-hidden transition-all duration-200
                    ${error ? 'border-red-500' : 'border-slate-300 hover:border-slate-400 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20'}
                `}
            >
                <MenuBar editor={editor} />
                <EditorContent editor={editor} className="bg-white" />
            </div>
            {error && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}
