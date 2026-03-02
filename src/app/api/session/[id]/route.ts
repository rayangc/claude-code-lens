import { NextRequest, NextResponse } from 'next/server';
import { stat } from 'fs/promises';
import { findSessionFile } from '@/lib/indexer/scanner';
import { parseJsonlFile } from '@/lib/parser/jsonl';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const filePath = await findSessionFile(id);
    if (!filePath) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Generate ETag from file mtime + size
    const fileStat = await stat(filePath);
    const etag = `"${fileStat.mtimeMs}-${fileStat.size}"`;

    // Check If-None-Match — skip expensive parse if file hasn't changed
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return NextResponse.json({ unchanged: true }, { headers: { ETag: etag } });
    }

    const session = await parseJsonlFile(filePath);
    return NextResponse.json(session, {
      headers: { ETag: etag },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
