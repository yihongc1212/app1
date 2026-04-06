'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Note, Folder as FolderType } from '@/lib/types';

interface FolderTreeProps {
  folders: FolderType[];
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  onCreateNote: (folderId: string | null) => void;
  onDeleteNote: (noteId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

interface FolderItemProps {
  folder: FolderType;
  subFolders: FolderType[];
  folderNotes: Note[];
  allFolders: FolderType[];
  allNotes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  onCreateNote: (folderId: string | null) => void;
  onDeleteNote: (noteId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  depth: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTextSnippet(content: string): string {
  try {
    const parsed = JSON.parse(content);
    let text = '';
    const extractText = (node: { type?: string; text?: string; content?: unknown[] }) => {
      if (node.text) text += node.text + ' ';
      if (node.content) {
        (node.content as { type?: string; text?: string; content?: unknown[] }[]).forEach(extractText);
      }
    };
    extractText(parsed);
    return text.trim().slice(0, 60) || 'No content';
  } catch {
    return content.slice(0, 60) || 'No content';
  }
}

function NoteItem({
  note,
  isSelected,
  onSelect,
  onDelete,
  indent,
}: {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  indent: number;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`group relative flex items-start gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${
        isSelected
          ? 'bg-indigo-600 text-white'
          : 'hover:bg-white/10 text-sidebar-text'
      }`}
      style={{ paddingLeft: `${indent + 8}px` }}
      onClick={onSelect}
    >
      <FileText
        size={14}
        className={`mt-0.5 flex-shrink-0 ${isSelected ? 'text-indigo-200' : 'text-sidebar-muted'}`}
      />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
          {note.title || 'Untitled Note'}
        </div>
        <div className={`text-xs truncate mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
          {formatDate(note.updatedAt)} · {getTextSnippet(note.content)}
        </div>
      </div>
      <button
        className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/20 flex-shrink-0 ${
          isSelected ? 'text-indigo-200' : 'text-slate-400'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
      >
        <MoreHorizontal size={14} />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          <div className="absolute right-2 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[140px]">
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
            >
              <Trash2 size={14} />
              Delete Note
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FolderItem({
  folder,
  subFolders,
  folderNotes,
  allFolders,
  allNotes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onRenameFolder,
  onDeleteFolder,
  depth,
}: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const handleRename = () => {
    if (newName.trim() && newName !== folder.name) {
      onRenameFolder(folder.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const indentPx = depth * 16 + 8;

  return (
    <div>
      <div
        className="group flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-white/10 cursor-pointer transition-colors"
        style={{ paddingLeft: `${indentPx}px` }}
        onClick={() => !isRenaming && setIsOpen(!isOpen)}
      >
        <span className="text-slate-400">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="text-slate-300">
          {isOpen ? <FolderOpen size={14} /> : <Folder size={14} />}
        </span>

        {isRenaming ? (
          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setNewName(folder.name);
                  setIsRenaming(false);
                }
              }}
              className="flex-1 bg-white/20 text-white text-sm px-1 py-0.5 rounded outline-none border border-indigo-400"
            />
            <button onClick={handleRename} className="text-green-400 hover:text-green-300">
              <Check size={12} />
            </button>
            <button
              onClick={() => {
                setNewName(folder.name);
                setIsRenaming(false);
              }}
              className="text-red-400 hover:text-red-300"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <span className="flex-1 text-sm text-slate-200 truncate">{folder.name}</span>
        )}

        {!isRenaming && (
          <button
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/20 text-slate-400"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreHorizontal size={14} />
          </button>
        )}

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
            <div className="absolute right-2 z-20 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[160px]">
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateNote(folder.id);
                  setShowMenu(false);
                  setIsOpen(true);
                }}
              >
                <FileText size={14} />
                New Note Here
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                  setShowMenu(false);
                }}
              >
                <Pencil size={14} />
                Rename Folder
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder(folder.id);
                  setShowMenu(false);
                }}
              >
                <Trash2 size={14} />
                Delete Folder
              </button>
            </div>
          </>
        )}
      </div>

      {isOpen && (
        <div>
          {subFolders.map((sub) => (
            <FolderItem
              key={sub.id}
              folder={sub}
              subFolders={allFolders.filter((f) => f.parentId === sub.id)}
              folderNotes={allNotes.filter((n) => n.folderId === sub.id)}
              allFolders={allFolders}
              allNotes={allNotes}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
              onCreateNote={onCreateNote}
              onDeleteNote={onDeleteNote}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              depth={depth + 1}
            />
          ))}
          {folderNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onSelect={() => onSelectNote(note)}
              onDelete={() => onDeleteNote(note.id)}
              indent={indentPx + 12}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  folders,
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onRenameFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const rootFolders = folders.filter((f) => f.parentId === null);
  const unfiledNotes = notes.filter((n) => n.folderId === null);

  return (
    <div className="space-y-0.5">
      {rootFolders.map((folder) => (
        <div key={folder.id} className="relative">
          <FolderItem
            folder={folder}
            subFolders={folders.filter((f) => f.parentId === folder.id)}
            folderNotes={notes.filter((n) => n.folderId === folder.id)}
            allFolders={folders}
            allNotes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={onSelectNote}
            onCreateNote={onCreateNote}
            onDeleteNote={onDeleteNote}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            depth={0}
          />
        </div>
      ))}

      {unfiledNotes.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unfiled Notes
            </span>
          </div>
          {unfiledNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onSelect={() => onSelectNote(note)}
              onDelete={() => onDeleteNote(note.id)}
              indent={8}
            />
          ))}
        </div>
      )}

      {folders.length === 0 && unfiledNotes.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <FileText size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No notes yet</p>
          <p className="text-xs mt-1 opacity-70">Create a folder or note to get started</p>
        </div>
      )}
    </div>
  );
}
