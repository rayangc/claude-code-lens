import { NextRequest, NextResponse } from 'next/server';
import { findSessionFile } from '@/lib/indexer/scanner';
import { parseJsonlFile } from '@/lib/parser/jsonl';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const filePath = await findSessionFile(id);
    if (!filePath) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = await parseJsonlFile(filePath);
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
