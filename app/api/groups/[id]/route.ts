import { NextResponse } from 'next/server';
import { store } from '@/app/lib/store';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  const { name, members } = await request.json();
  
  const updatedGroup = await store.editGroup(id, name, members);
  
  if (!updatedGroup) {
    return new NextResponse('Group not found', { status: 404 });
  }
  
  return NextResponse.json(updatedGroup);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  
  const deleted = await store.deleteGroup(id);
  
  if (!deleted) {
    return new NextResponse('Group not found', { status: 404 });
  }
  
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  const group = await store.getGroup(id);
  
  if (!group) {
    return new NextResponse('Group not found', { status: 404 });
  }
  
  return NextResponse.json(group);
} 