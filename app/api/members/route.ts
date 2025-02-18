import { NextResponse } from 'next/server';
import { store } from '@/app/lib/store';

export async function GET() {
  const members = await store.getAllMembers();
  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  const newMember = await store.addMember(name);
  return NextResponse.json(newMember);
} 