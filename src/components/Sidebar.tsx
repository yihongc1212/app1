'use client';

import { useState } from 'react';
import { Plus, FolderPlus, FileText, Brain, Search } from 'lucide-react';
import { Note, Folder } from '@/lib/types';
import FolderTree from './FolderTree';

interface SidebarProps {
  folders: Folder[];
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  onCreateNote: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onDeleteNote: (noteId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export default function Sidebar({
  folders,
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onCreateFolder,
  onDeleteNote,
  onRenameFolder,
  onDeleteFolder,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = searchQuery
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: '280px',
        minWidth: '280px',
        background: '#1a1a2e',
        borderRight: '1px solid #2d3748',
      }}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <Brain size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">AI Notes</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 text-slate-200 placeholder-slate-500 text-sm pl-8 pr-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 border border-white/10"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 py-3 flex gap-2 border-b border-white/10">
        <button
          onClick={() => onCreateFolder(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium transition-colors flex-1 justify-center"
          title="New Folder"
        >
          <FolderPlus size={14} />
          New Folder
        </button>
        <button
          onClick={() => onCreateNote(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex-1 justify-center"
          title="New Note"
        >
          <Plus size={14} />
          New Note
        </button>
      </div>

      {/* Note List / Folder Tree */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-2 py-2">
        {searchQuery && filteredNotes ? (
          <div>
            <div className="px-2 py-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Search Results ({filteredNotes.length})
              </span>
            </div>
            {filteredNotes.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Search size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notes found</p>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = selectedNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    className={`flex items-start gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors mb-0.5 ${
                      isSelected ? 'bg-indigo-600' : 'hover:bg-white/10'
                    }`}
                    onClick={() => onSelectNote(note)}
                  >
                    <FileText
                      size={14}
                      className={`mt-0.5 flex-shrink-0 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {note.title || 'Untitled Note'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <FolderTree
            folders={folders}
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={onSelectNote}
            onCreateNote={onCreateNote}
            onDeleteNote={onDeleteNote}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-xs text-slate-500">
          {notes.length} note{notes.length !== 1 ? 's' : ''} · {folders.length} folder{folders.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
