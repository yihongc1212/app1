'use client';

import { useState, useEffect, useCallback } from 'react';
import { Note, Folder } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import NoteEditor from '@/components/NoteEditor';
import { FileText } from 'lucide-react';

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  const fetchData = useCallback(async () => {
    try {
      const [notesRes, foldersRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/folders'),
      ]);
      const [notesData, foldersData] = await Promise.all([
        notesRes.json(),
        foldersRes.json(),
      ]);
      setNotes(notesData);
      setFolders(foldersData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateNote = async (folderId: string | null = null) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Note', content: '', folderId, tags: [] }),
      });
      const newNote: Note = await res.json();
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleCreateFolder = async (parentId: string | null = null) => {
    const name = prompt('Enter folder name:');
    if (!name?.trim()) return;
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), parentId }),
      });
      const newFolder: Folder = await res.json();
      setFolders((prev) => [...prev, newFolder]);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      // Move notes in deleted folder to unfiled
      setNotes((prev) =>
        prev.map((n) => (n.folderId === folderId ? { ...n, folderId: null } : n))
      );
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNoteId === noteId) setSelectedNoteId(null);
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleNoteUpdate = async (noteId: string, updates: Partial<Note>) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated: Note = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
    } catch (err) {
      console.error('Failed to update note:', err);
      throw err;
    }
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const updated: Folder = await res.json();
      setFolders((prev) => prev.map((f) => (f.id === folderId ? updated : f)));
    } catch (err) {
      console.error('Failed to rename folder:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        notes={notes}
        folders={folders}
        selectedNoteId={selectedNoteId}
        onSelectNote={(note: Note) => setSelectedNoteId(note.id)}
        onCreateNote={handleCreateNote}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        onDeleteNote={handleDeleteNote}
        onRenameFolder={handleRenameFolder}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onUpdate={handleNoteUpdate}
          />
        ) : (
          <div className="flex flex-1 h-full items-center justify-center bg-white">
            <div className="text-center max-w-sm px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No note selected</h2>
              <p className="text-gray-400 text-sm mb-6">
                Select a note from the sidebar or create a new one to get started.
              </p>
              <button
                onClick={() => handleCreateNote(null)}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
              >
                <FileText size={16} />
                Create New Note
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
