import { NextResponse } from 'next/server';
import { store } from '@/app/lib/store';

export async function GET() {
  const groups = await store.getAllGroups();
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const { name, members } = await request.json();
  const newGroup = await store.addGroup(name, members);
  return NextResponse.json(newGroup);
} 