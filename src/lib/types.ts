export interface Note {
  id: string;
  title: string;
  content: string; // TipTap JSON string
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface AppData {
  notes: Note[];
  folders: Folder[];
}

export type AIAction = 'summarize' | 'improve' | 'generate-title' | 'continue' | 'chat';

export interface AIRequest {
  action: AIAction;
  noteContent: string;
  noteTitle?: string;
  message?: string;
  chatHistory?: ChatMessage[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
