import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAllNotes, createNote } from '@/lib/storage';
import { Note } from '@/lib/types';

export async function GET() {
  try {
    const notes = getAllNotes();
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const note: Note = {
      id: uuidv4(),
      title: body.title || 'Untitled Note',
      content: body.content || '',
      folderId: body.folderId || null,
      createdAt: now,
      updatedAt: now,
      tags: body.tags || [],
    };
    const created = createNote(note);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
