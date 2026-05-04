import { type NextRequest, NextResponse } from 'next/server';
import { searchMembers } from '@/lib/actions/searchMembers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') ?? '';
  const members = await searchMembers(query);

  return NextResponse.json({ members });
}