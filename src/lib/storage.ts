import fs from 'fs';
import path from 'path';
import { AppData, Note, Folder } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'app-data.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readData(): AppData {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const initial: AppData = { notes: [], folders: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as AppData;
  } catch {
    const initial: AppData = { notes: [], folders: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function writeData(data: AppData): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Notes
export function getAllNotes(): Note[] {
  return readData().notes;
}

export function getNoteById(id: string): Note | undefined {
  return readData().notes.find((n) => n.id === id);
}

export function createNote(note: Note): Note {
  const data = readData();
  data.notes.push(note);
  writeData(data);
  return note;
}

export function updateNote(id: string, updates: Partial<Note>): Note | null {
  const data = readData();
  const index = data.notes.findIndex((n) => n.id === id);
  if (index === -1) return null;
  data.notes[index] = { ...data.notes[index], ...updates, updatedAt: new Date().toISOString() };
  writeData(data);
  return data.notes[index];
}

export function deleteNote(id: string): boolean {
  const data = readData();
  const before = data.notes.length;
  data.notes = data.notes.filter((n) => n.id !== id);
  if (data.notes.length === before) return false;
  writeData(data);
  return true;
}

// Folders
export function getAllFolders(): Folder[] {
  return readData().folders;
}

export function getFolderById(id: string): Folder | undefined {
  return readData().folders.find((f) => f.id === id);
}

export function createFolder(folder: Folder): Folder {
  const data = readData();
  data.folders.push(folder);
  writeData(data);
  return folder;
}

export function updateFolder(id: string, updates: Partial<Folder>): Folder | null {
  const data = readData();
  const index = data.folders.findIndex((f) => f.id === id);
  if (index === -1) return null;
  data.folders[index] = { ...data.folders[index], ...updates };
  writeData(data);
  return data.folders[index];
}

export function deleteFolder(id: string): boolean {
  const data = readData();
  const before = data.folders.length;
  // Remove folder and move its notes to unfiled
  data.folders = data.folders.filter((f) => f.id !== id);
  data.notes = data.notes.map((n) =>
    n.folderId === id ? { ...n, folderId: null, updatedAt: new Date().toISOString() } : n
  );
  if (data.folders.length === before) return false;
  writeData(data);
  return true;
}
