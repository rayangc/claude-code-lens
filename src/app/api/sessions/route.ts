import { NextRequest, NextResponse } from 'next/server';
import { getSessions } from '@/lib/indexer/scanner';

export async function GET(request: NextRequest) {
  const project = request.nextUrl.searchParams.get('project');
  if (!project) {
    return NextResponse.json({ error: 'Missing project parameter' }, { status: 400 });
  }

  try {
    const sessions = await getSessions(project);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
