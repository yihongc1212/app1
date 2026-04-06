import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAllFolders, createFolder } from '@/lib/storage';
import { Folder } from '@/lib/types';

export async function GET() {
  try {
    const folders = getAllFolders();
    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const folder: Folder = {
      id: uuidv4(),
      name: body.name || 'New Folder',
      parentId: body.parentId || null,
      createdAt: new Date().toISOString(),
    };
    const created = createFolder(folder);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
