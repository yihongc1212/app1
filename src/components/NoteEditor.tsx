'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Note } from '@/lib/types';
import EditorToolbar from './EditorToolbar';
import AIPanel from './AIPanel';
import { Tag, X, Save, CheckCircle2 } from 'lucide-react';

interface NoteEditorProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => Promise<void>;
}

type SaveStatus = 'saved' | 'saving' | 'unsaved';

export default function NoteEditor({ note, onUpdate }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [editorContent, setEditorContent] = useState(note.content);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'code-block',
          },
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note here...',
      }),
    ],
    content: note.content ? JSON.parse(note.content) : '',
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      setEditorContent(json);
      setSaveStatus('unsaved');
      scheduleSave(json, title, tags);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none',
      },
    },
  });

  const scheduleSave = useCallback(
    (content: string, currentTitle: string, currentTags: string[]) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      setSaveStatus('unsaved');
      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          await onUpdate(note.id, {
            content,
            title: currentTitle,
            tags: currentTags,
          });
          setSaveStatus('saved');
        } catch {
          setSaveStatus('unsaved');
        }
      }, 1000);
    },
    [note.id, onUpdate]
  );

  // Update editor when note changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setTitle(note.title);
    setTags(note.tags || []);
    setSaveStatus('saved');

    if (editor) {
      const currentContent = JSON.stringify(editor.getJSON());
      if (currentContent !== note.content) {
        try {
          const parsed = note.content ? JSON.parse(note.content) : '';
          editor.commands.setContent(parsed, false);
        } catch {
          editor.commands.setContent('', false);
        }
      }
    }
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSaveStatus('unsaved');
    scheduleSave(editorContent, newTitle, tags);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (!tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        scheduleSave(editorContent, title, newTags);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    scheduleSave(editorContent, title, newTags);
  };

  const handleApplyAIResult = (text: string) => {
    if (editor) {
      editor.chain().focus().insertContent(text).run();
    }
  };

  const handleApplyTitle = (newTitle: string) => {
    setTitle(newTitle);
    scheduleSave(editorContent, newTitle, tags);
  };

  // Get plain text content for AI
  const getPlainTextContent = (): string => {
    if (!editor) return '';
    return editor.getText();
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Main Editor Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-white">
        {/* Toolbar */}
        <EditorToolbar
          editor={editor}
          showAIPanel={showAIPanel}
          onToggleAIPanel={() => setShowAIPanel(!showAIPanel)}
        />

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Note title..."
              className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none border-none bg-transparent mb-4 leading-tight"
            />

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap mb-6 pb-4 border-b border-gray-100">
              <Tag size={14} className="text-gray-400 flex-shrink-0" />
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-indigo-900 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? 'Add tags (Enter or comma)...' : 'Add tag...'}
                className="text-sm text-gray-500 placeholder-gray-300 outline-none bg-transparent flex-1 min-w-[120px]"
              />
            </div>

            {/* TipTap Editor */}
            <EditorContent
              editor={editor}
              className="min-h-[400px] text-gray-700"
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-8 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              {editor?.storage?.characterCount?.characters?.() ?? 0} characters
            </span>
            <span>
              {editor?.getText()?.trim().split(/\s+/).filter(Boolean).length ?? 0} words
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {saveStatus === 'saving' && (
              <>
                <Save size={12} className="animate-pulse text-amber-500" />
                <span className="text-amber-500">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 size={12} className="text-green-500" />
                <span className="text-green-600">Saved</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-gray-400">Unsaved changes</span>
            )}
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <AIPanel
          noteContent={getPlainTextContent()}
          noteTitle={title}
          onApplyResult={handleApplyAIResult}
          onApplyTitle={handleApplyTitle}
        />
      )}
    </div>
  );
}
